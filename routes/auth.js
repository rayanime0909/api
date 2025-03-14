require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { Users, Op } = require('../database');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      let user = await Users.findOne({ 
        where: { 
          googleId: profile.id 
        } 
      });

      if (!user) {
        user = await Users.create({
          id: `anime_ray_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          googleId: profile.id,
          username: profile.displayName || profile.emails[0].value.split('@')[0],
          email: profile.emails[0].value,
          
          avatar: profile.photos[0]?.value || process.env.DEFAULT_AVATAR_URL,
          isAdmin: false
        });
      }

      const token = jwt.sign(
        { userId: user.id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return done(null, { user, token });
    } catch (error) {
      return done(error, null);
    }
  }
));

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized", error: error.message });
  }
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await Users.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'البريد الإلكتروني او كلمة المرور غير صحيح' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'البريد الإلكتروني او كلمة المرور غير صحيح' });
    }

    const token = jwt.sign(
      { userId: user.id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
      loginMethod: user.loginMethod
      
    }});
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة' });
    }


    const existingUser = await Users.findOne({ 
      where: { 
        [Op.or]: [{ email }, { username }] 
      } 
    });

    if (existingUser) {
      return res.status(409).json({ error: 'البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await Users.create({
      id: `anime_ray_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username,
      email,
      password: hashedPassword,
      loginMethod: 'email',
      isAdmin: false
    });

    const token = jwt.sign(
      { userId: newUser.id, isAdmin: newUser.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      message: 'تم إنشاء الحساب بنجاح', 
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        loginMethod: newUser.loginMethod
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await Users.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000;

    await Users.update(
      { 
        resetPasswordToken: resetToken, 
        resetPasswordExpires: resetTokenExpiry 
      },
      { where: { id: user.id } }
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'إعادة تعيين كلمة المرور - AnimeRay',
      html: `
        <h1>إعادة تعيين كلمة المرور</h1>
        <p>لقد طلبت إعادة تعيين كلمة المرور. انقر على الرابط التالي للمتابعة:</p>
        <a href="${resetUrl}">إعادة تعيين كلمة المرور</a>
        <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.</p>
        <p>سينتهي صلاحية هذا الرابط خلال ساعة.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة طلبك' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await Users.findOne({ 
      where: { 
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() } 
      } 
    });

    if (!user) {
      return res.status(400).json({ error: 'رمز إعادة التعيين غير صالح أو منتهي الصلاحية' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await Users.update(
      { 
        password: hashedPassword, 
        resetPasswordToken: null, 
        resetPasswordExpires: null 
      },
      { where: { id: user.id } }
    );

    res.status(200).json({ message: 'تم إعادة تعيين كلمة المرور بنجاح' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إعادة تعيين كلمة المرور' });
  }
});

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await Users.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: 'يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمة المرور الحالية' });
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await Users.update(
      { password: hashedNewPassword },
      { where: { id: userId } }
    );

    res.status(200).json({ message: 'تم تغيير كلمة المرور بنجاح' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تغيير كلمة المرور' });
  }
});
router.post('/register-google', async (req, res) => {
  try {
    const { email, displayName, photoUrl } = req.body;

    let existingUser = await Users.findOne({ where: { email } });

    if (existingUser) {
      const token = jwt.sign(
        { userId: existingUser.id, isAdmin: existingUser.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        message: 'تم تسجيل الدخول بنجاح',
        token,
        user: {
          id: existingUser.id,
          username: existingUser.username,
          email: existingUser.email,
          isAdmin: existingUser.isAdmin,
          loginMethod: 'google',
        }
      });
    }

    const userId = `anime_ray_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newUser = await Users.create({
      id: userId,
      email,
      username: displayName || email.split('@')[0],
      avatar: photoUrl || process.env.DEFAULT_AVATAR_URL,
      loginMethod: 'google',
      password: 'defaultPassword',
      isAdmin: false,
    });

    const token = jwt.sign(
      { userId: newUser.id, isAdmin: newUser.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'تم إنشاء الحساب بنجاح',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        loginMethod: newUser.loginMethod
      }
    });

  } catch (error) {
    console.error('Google registration error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب' });
  }
});

router.get('/google-login', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${req.user.token}`);
  }
);

module.exports = { authenticate, router };
