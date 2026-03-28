const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const Tool = require('../models/Tool');

dotenv.config({ path: path.join(__dirname, '../.env') });

const ids = process.argv.slice(2);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const query = ids.length > 0
    ? { id: { $in: ids } }
    : { status: { $in: ['active', 'experimental'] } };

  const rows = await Tool.find(query, { id: 1, name: 1, category: 1, status: 1 })
    .sort({ category: 1, name: 1 })
    .lean();

  const categoryCounts = rows.reduce((acc, row) => {
    acc[row.category || 'uncategorized'] = (acc[row.category || 'uncategorized'] || 0) + 1;
    return acc;
  }, {});

  console.log('count', rows.length);
  console.log('categoryCounts', categoryCounts);
  if (ids.length > 0) {
    console.log(rows);
  }

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
