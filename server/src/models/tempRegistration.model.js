import mongoose from "mongoose";

const tempRegistrationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 20,
    validate: {
      validator: function(v) {
        if (typeof v !== 'string') return false;
        const s = v.normalize('NFC');
        // periods are not allowed
        if (s.includes('.')) return false;
        // allowed characters: letters (incl. accents), numbers and spaces
        if (!/^[\p{L}\p{N} ]+$/u.test(s)) return false;
        return true;
      },
      message: props => `${props.value} is not a valid username. Use 2-20 characters: letters, numbers, and spaces. Periods are not allowed.`
    }
  },
  usernameKey: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  birthday: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other'],
  },
  verificationCode: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
}, 
    {timestamps: true }
);

// Normalize username into usernameKey (same logic as User model)
tempRegistrationSchema.pre('validate', async function(next) {
  try {
    if (this.username) {
      // normalize and trim for storage/display
      const normalized = String(this.username).normalize('NFC').trim();
      this.username = normalized;

      // create canonical key: lowercase, remove periods
      const key = normalized.toLowerCase().replace(/\./g, '');

      // expanded forbidden words and domain-like suffixes (same as User)
      const forbidden = [
        'admin','support','root','system','postmaster','webmaster',
        'contact','security','abuse','mail','smtp','ftp','api',
        'help','info','billing','test'
      ];
      const forbiddenSuffixes = ['.com', '.net', '.org', '.io', '.app', '.dev', '.me'];

      // check forbidden exact words
      if (forbidden.includes(key)) {
        const err = new Error('Username contains a forbidden word');
        err.name = 'ValidationError';
        return next(err);
      }

      // also reject usernames that end with domain suffix when periods removed
      for (const s of forbiddenSuffixes) {
        if (key.endsWith(s.replace('.', ''))) {
          const err = new Error('Username cannot look like a domain');
          err.name = 'ValidationError';
          return next(err);
        }
      }

      this.usernameKey = key;
    }

    next();
  } catch (error) {
    next(error);
  }
});

const TempRegistration = mongoose.model("TempRegistration", tempRegistrationSchema);

export default TempRegistration;