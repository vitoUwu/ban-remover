import { InteractionType } from "discord.js";
import unbanCommand from "../commands/unban.js";

/**
 *
 * @param {import("discord.js").Interaction<"cached">} interaction
 */
export default async function execute(interaction) {
  switch (interaction.type) {
    case InteractionType.ApplicationCommand: {
      if (!interaction.guild.members.me.permissions.has("BanMembers")) {
        return interaction.reply({
          content:
            'Não tenho a permissão "Banir Membros", logo não consigo desbanir pessoas! :(',
        });
      }

      await unbanCommand(interaction);
      break;
    }
  }
}
