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
    sparse: true,
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

const TempRegistration = mongoose.model("TempRegistration", tempRegistrationSchema);

export default TempRegistration;