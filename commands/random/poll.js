const { 
    SlashCommandBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    ButtonBuilder, 
    ActionRowBuilder, 
    ButtonStyle, 
    MessageFlags 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll with up to 4 options')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The poll question')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option1')
                .setDescription('First option')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option2')
                .setDescription('Second option')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option3')
                .setDescription('Third option')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option4')
                .setDescription('Fourth option')
                .setRequired(false)),

    async execute(interaction) {
        const question = interaction.options.getString('question');
        const options = [
            interaction.options.getString('option1'),
            interaction.options.getString('option2'),
            interaction.options.getString('option3'),
            interaction.options.getString('option4')
        ].filter(Boolean);

        const votes = new Map(options.map(option => [option, new Set()]));
        
        function generatePollDisplay() {
            const totalVotes = Array.from(votes.values()).reduce((sum, voters) => sum + voters.size, 0);
            
            let pollContent = `## 📊 ${question}\n\n`;
            
            options.forEach((option, index) => {
                const votesCount = votes.get(option).size;
                const percentage = totalVotes ? (votesCount / totalVotes * 100).toFixed(1) : 0;
                const barLength = Math.round(percentage / 5);
                const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
                
                pollContent += `### Option ${index + 1}: ${option}\n`;
                pollContent += `> ${bar} ${percentage}% (${votesCount} votes)\n\n`;
            });

            pollContent += `\n**Total Votes:** ${totalVotes}`;
            
            return new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(pollContent)
                );
        }

        const buttons = options.map((option, index) => 
            new ButtonBuilder()
                .setCustomId(`poll_${index}`)
                .setLabel(`Option ${index + 1}`)
                .setStyle(ButtonStyle.Primary)
        );

        const row = new ActionRowBuilder().addComponents(buttons);

        const reply = await interaction.reply({
            components: [row],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [] },
            content: ' ',
            embeds: [],
            componentsv2: [generatePollDisplay()]
        }).catch(async () => {
            await interaction.reply({
                content: '## 📊 ' + question + '\n\n*Container v2 is not supported on this server or bot version.*',
                components: [row]
            });
        });

        const message = await interaction.fetchReply();

        const collector = message.createMessageComponentCollector({ time: 600000 });

        collector.on('collect', async i => {
            const optionIndex = parseInt(i.customId.split('_')[1]);
            const selectedOption = options[optionIndex];

            options.forEach(option => {
                votes.get(option).delete(i.user.id);
            });

            votes.get(selectedOption).add(i.user.id);

            const updatedRow = new ActionRowBuilder().addComponents(
                options.map((option, idx) =>
                    new ButtonBuilder()
                        .setCustomId(`poll_${idx}`)
                        .setLabel(`Option ${idx + 1}`)
                        .setStyle(ButtonStyle.Primary)
                )
            );

            await i.update({
                components: [updatedRow],
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] },
                content: ' ',
                embeds: [],
                componentsv2: [generatePollDisplay()]
            });
        });

        collector.on('end', async () => {
            const disabledButtons = options.map((option, index) =>
                new ButtonBuilder()
                    .setCustomId(`poll_${index}`)
                    .setLabel(`Option ${index + 1}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

            const disabledRow = new ActionRowBuilder().addComponents(disabledButtons);

            await interaction.editReply({
                components: [disabledRow],
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] },
                content: '**Poll Ended**',
                embeds: [],
                componentsv2: [generatePollDisplay()]
            });
        });
    }
};