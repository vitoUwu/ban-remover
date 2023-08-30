import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { data as unbanCommandData } from "./commands/unban.js";
import interactionCreateExecute from "./events/interactionCreate.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildModeration],
  rest: {
    rejectOnRateLimit: (data) => data.global,
  },
  failIfNotExists: false,
});

client.on("interactionCreate", async (interaction) => {
  try {
    await interactionCreateExecute(interaction);
  } catch (err) {
    setStarted(false);
    console.error(err);
  }
});

export let startedUnban = false;
/**
 *
 * @param {boolean} started
 */
export function setStarted(started) {
  client.user.setPresence({
    status: started ? "dnd" : "online",
  });

  startedUnban = started;
}

client
  .login(process.env.DISCORD_TOKEN)
  .then(() => client.application.commands.set([unbanCommandData.toJSON()]))
  .then(() => console.log(`Logado como ${client.user.tag}`));
