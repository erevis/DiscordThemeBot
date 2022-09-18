# DiscordThemeBot
Discord bot that plays personalized theme music for users on server join.

*Made with javascript, node.js, discord.js, and a MySQL database for storing youtube links.*

- Features commands to set theme music by youtube link and time stamps.
- Ability to enable/disable the bot for specific users.
- Bot automatically joins voice channel on user entry and plays theme music, leaving after the specified song time frame.

## How to use
- Slash Commands 
1) /set 'youtube link' 'start time' 'end time'  
Start time and end time are represented as time stamps, ex: 0:05 for 5 seconds.  
*Example: !t set https://www.youtube.com/watch?v=HaOmp140NvU 0:20 0:27*  
2) /enable  
Enables the bot for your server joins
3) /disable  
Disables the bot for your server joins
3) /help  
Gives an overview of these basic commands and their arguments.

## TODO
- [ ] Integrate buttons that allow you to copy other people's themes. Maybe people can post theme suggestions/presets.
- [ ] Write up a process for using this bot in a discord channel of your own.

*Please read the v2.0 release information to find specific descriptions of recent improvements and modifications to the bot.
