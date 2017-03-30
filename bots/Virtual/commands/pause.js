module.exports = async function pause(self, params) {
  if (self.currentJob === undefined) {
    throw new Error(`Bot ${self.settings.name} is not currently processing a job`);
  }
  if (self.fsm.current !== 'executingJob') {
    throw new Error(`Cannot pause bot from state "${self.fsm.current}"`);
  }
  if (self.currentJob.fsm.current !== 'running') {
    throw new Error(`Cannot pause job from state "${self.currentJob.fsm.current}"`);
  }

  const commandArray = [];

  // Pause the job
  commandArray.push({
    postCallback: () => {
      self.fsm.pause();
      console.log('pausing job', self.currentJob.getJob());
      self.currentJob.pause();
      console.log('paused job', self.currentJob.getJob());
    },
  });

  // Move the gantry wherever you want
  commandArray.push({ delay: 1000 });

  // confirm the bot is now paused
  commandArray.push({
    postCallback: () => {
      self.fsm.pauseDone();
    },
  });

  self.queue.queueCommands(commandArray);
  console.log('just queued the pause commands');
  return self.getBot();
};