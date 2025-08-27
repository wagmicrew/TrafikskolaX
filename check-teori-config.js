const { db } = require('./lib/db');
const { teoriLessonTypes } = require('./lib/db/schema');

async function checkTeoriConfig() {
  try {
    const result = await db.select().from(teoriLessonTypes);
    console.log('Current Teori lesson types:');
    result.forEach(type => {
      console.log(`- ${type.name}: allowsSupervisors = ${type.allowsSupervisors}, price = ${type.price}, pricePerSupervisor = ${type.pricePerSupervisor}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTeoriConfig();
