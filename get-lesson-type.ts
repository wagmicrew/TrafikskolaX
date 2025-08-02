import { db } from './lib/db';
import { lessonTypes } from './lib/db/schema';

async function getLessonType() {
  try {
    const result = await db.select().from(lessonTypes).limit(1);
    console.log(JSON.stringify(result[0], null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

getLessonType();
