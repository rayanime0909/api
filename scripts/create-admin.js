require('dotenv').config();
const bcrypt = require('bcrypt');
const { Users } = require('../database');
const { v4: uuidv4 } = require('uuid');

async function createAdminUser(email, password, username) {
    try {
        const existingUser = await Users.findOne({ where: { email } });
        if (existingUser) {
            console.log('المستخدم موجود بالفعل!');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await Users.create({
            id: uuidv4(),
            email,
            password: hashedPassword,
            username,
            isAdmin: true,
            role: 1
        });

        console.log('تم إنشاء المستخدم المسؤول بنجاح:', {
            id: user.id,
            email: user.email,
            username: user.username
        });
    } catch (error) {
        console.error('خطأ في إنشاء المستخدم:', error);
    }
}

const email = process.argv[2];
const password = process.argv[3];
const username = process.argv[4];

if (!email || !password || !username) {
    console.log('الاستخدام: node create-admin.js <email> <password> <username>');
    process.exit(1);
}

createAdminUser(email, password, username);
