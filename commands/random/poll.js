const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

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
            components: [generatePollDisplay(), row],
            fetchReply: true
        });

        const collector = reply.createMessageComponentCollector({ time: 600000 }); // 10 minutes

        collector.on('collect', async i => {
            const optionIndex = parseInt(i.customId.split('_')[1]);
            const selectedOption = options[optionIndex];

            options.forEach(option => {
                votes.get(option).delete(i.user.id);
            });

            votes.get(selectedOption).add(i.user.id);

            await i.update({
                components: [generatePollDisplay(), row]
            });
        });

        collector.on('end', () => {
            const finalDisplay = generatePollDisplay();
            const disabledButtons = options.map((_, index) => 
                new ButtonBuilder()
                    .setCustomId(`poll_${index}`)
                    .setLabel(`Option ${index + 1}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

            const disabledRow = new ActionRowBuilder().addComponents(disabledButtons);

            interaction.editReply({
                components: [finalDisplay, disabledRow],
                content: '**Poll Ended**'
            });
        });
    }
};