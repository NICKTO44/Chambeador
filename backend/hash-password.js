const bcrypt = require('bcryptjs');
const password = 'Timetofuck4.';
const hash = bcrypt.hashSync(password, 10);
console.log('Hash generado:');
console.log(hash);
