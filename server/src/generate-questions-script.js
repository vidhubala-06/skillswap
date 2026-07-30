const pool = require('./db/pool');
const { generateQuestionBankForSkill } = require('./modules/quiz/quiz.service');
const { getQuestionCountForSkill } = require('./modules/quiz/quiz.queries');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  try {
    const [skills] = await pool.query('SELECT id, name FROM skills ORDER BY id ASC');

    console.log(`Found ${skills.length} skills. Starting generation...\n`);

    for (const skill of skills) {
      const existingCount = await getQuestionCountForSkill(skill.id);

      if (existingCount >= 30) {
        console.log(`⏭️  Skipping "${skill.name}" (already has ${existingCount} questions)`);
        continue;
      }

      console.log(`⏳ Generating questions for "${skill.name}"...`);
      try {
        const count = await generateQuestionBankForSkill(skill.id, skill.name);
        console.log(`✅ Generated ${count} questions for "${skill.name}"\n`);
      } catch (err) {
        console.error(`❌ Failed for "${skill.name}": ${err.message}\n`);
      }

      // Wait between calls to respect free-tier rate limits (RPM)
      await delay(5000);
    }

    console.log('All done.');
    process.exit(0);
  } catch (err) {
    console.error('Script error:', err);
    process.exit(1);
  }
}

run();