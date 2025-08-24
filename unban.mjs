import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.GUILD_ID;
const DELAY = Number(process.env.UNBAN_DELAY_MS ?? 1100);

if (!token || !guildId) {
  console.error('❌ DISCORD_TOKEN ou GUILD_ID manquant dans .env');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

client.once('ready', async () => {
  try {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    const guild = await client.guilds.fetch(guildId);
    if (!guild) throw new Error('Guild introuvable (vérifie GUILD_ID et l’invitation du bot)');

    console.log('📥 Récupération de la banlist…');
    const bans = await guild.bans.fetch();
    console.log(`🔢 Bannissements trouvés: ${bans.size}`);

    if (bans.size === 0) {
      console.log('✅ Aucun utilisateur à débannir.');
      process.exit(0);
    }

    let ok = 0, fail = 0;
    for (const [userId, ban] of bans) {
      try {
        await guild.members.unban(userId, 'Unban all (script)');
        ok++;
        console.log(`✅ Unban: ${ban.user.tag} (${userId})  [ok:${ok} | fail:${fail}]`);
      } catch (e) {
        fail++;
        console.log(`❌ Échec unban: ${ban.user?.tag ?? userId} — ${String(e).slice(0,200)}`);
      }
      await sleep(DELAY); // respecte les rate-limits
    }

    console.log(`🏁 Terminé — OK: ${ok}, Échecs: ${fail}`);
    process.exit(0);
  } catch (err) {
    console.error('💥 Erreur:', err);
    process.exit(1);
  }
});

client.login(token).catch((e) => {
  console.error('💥 Login échoué:', e);
  process.exit(1);
});
