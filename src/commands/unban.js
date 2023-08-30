import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection,
  ComponentType,
  SlashCommandBuilder,
  SlashCommandIntegerOption,
} from "discord.js";
import { setStarted, startedUnban } from "../index.js";
import { formatSeconds } from "../utils/formatSeconds.js";
import { wait } from "../utils/wait.js";

export const data = new SlashCommandBuilder()
  .setName("unban")
  .setDescription("Desbane todos os usuários banidos no servidor")
  .setDefaultMemberPermissions("0")
  .setDMPermission(false)
  .addIntegerOption(
    new SlashCommandIntegerOption()
      .setName("quantidade")
      .setDescription("Selecione a quantidade de banimentos que deseja remover")
      .setMinValue(1)
      .setRequired(true)
  );

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction<"cached">} interaction
 */
export default async function execute(interaction) {
  if (startedUnban) {
    return interaction.reply({
      content: "Já estou desbanindo os membros",
      ephemeral: true,
    });
  }

  const amount = interaction.options.getInteger("quantidade");

  const reply = await interaction.reply({
    content: `Tem certeza de que deseja desbanir ${amount} usuários do servidor? Tenha em mente que a operação é cancelável porém os usuários desbanidos permanecerão desbanidos`,
    components: [
      new ActionRowBuilder().setComponents(
        new ButtonBuilder()
          .setCustomId("cancel")
          .setLabel("Cancelar")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("continue")
          .setLabel("Continuar")
          .setStyle(ButtonStyle.Success)
      ),
    ],
    fetchReply: true,
  });

  const response = await reply
    .awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      time: 60000,
    })
    .catch(() => null);

  if (!response || response.customId === "cancel") {
    return interaction.deleteReply();
  }

  const responseReply = await response.update({
    content: `Iniciando...\nPrevisão de término: calculando...`,
    components: [
      new ActionRowBuilder().setComponents(
        new ButtonBuilder()
          .setCustomId("stop")
          .setLabel("Parar")
          .setStyle(ButtonStyle.Danger)
      ),
    ],
    fetchReply: true,
  });

  let forceStop = false;
  const collector = responseReply.createMessageComponentCollector({
    filter: (i) => i.user.id === interaction.user.id,
    max: 1,
  });

  collector.on("collect", () => {
    setStarted(false);
    forceStop = true;
    response.message.edit({ components: [], content: "Operação cancelada" });
  });

  setStarted(true);
  const errorReport = [];
  const loopCount = Math.ceil(amount / 1000);
  const fetchCount = loopCount === 1 ? amount : 1000;
  let bansCache = new Collection();
  for (let j = 0; j < loopCount; j++) {
    if (forceStop) {
      break;
    }
    const bans = await interaction.guild.bans
      .fetch({
        limit: fetchCount,
        ...(bansCache.size ? { after: bansCache.lastKey() } : {}),
      })
      .catch(async (err) => {
        console.error(err);
        await response.message.edit({
          content: `Ocorreu um erro ao analizar os banimentos\n${err}`,
        });
        forceStop = true;
      });
    if (!bans?.size) {
      break;
    }
    bansCache = bansCache.concat(bans);
  }

  if (forceStop) {
    return;
  }

  let i = 0;
  let start = new Date();
  for await (const ban of bansCache.values()) {
    if (forceStop) {
      break;
    }

    if (!interaction.guild.members.me.permissions.has("BanMembers")) {
      await response.message.edit({
        content:
          "Alguém alterou minhas permissões e não posso continuar os desbanimentos",
      });
      break;
    }

    await interaction.guild.bans
      .remove(ban.user.id)
      .then(() => i++)
      .catch((err) =>
        errorReport.push(`Error on ${ban.user.id} (${ban.user.tag}): ${err}`)
      );

    if (i % 10 === 0) {
      const diff = Math.floor((new Date() - start) / 1000);
      start = new Date();
      await response.message.edit({
        content: `${i} usuários desbanidos.\nPrevisão de término: ${formatSeconds(
          diff * Math.floor((bansCache.size - i) / 10)
        )}`,
      });
    }
    await wait(100);
  }

  setStarted(false);

  await response.message.edit({
    content: `${i} usuários desbanidos com sucesso\n${errorReport.length} erros`,
    components: [],
    ...(errorReport.length
      ? {
          files: [
            {
              name: "errorLog.log",
              attachment: Buffer.from(`${errorReport.join("\n")}`),
            },
          ],
        }
      : {}),
  });
}
