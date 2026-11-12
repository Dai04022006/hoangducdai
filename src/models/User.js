
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Họ và tên không được để trống'],
            trim: true
        },

        email: {
            type: String,
            required: [true, 'Email không được để trống'],
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: [true, 'Mật khẩu không được để trống'],
            minlength: [6, 'Mật khẩu phải từ 6 ký tự trở lên']
        },

        phone: {
            type: String,
            default: ''
        },

        role: {
            type: String,
            enum: ['customer', 'admin'],
            default: 'customer'
        }
    },
    {
        timestamps: true
    }
);

// Mã hóa mật khẩu trước khi lưu vào MongoDB
userSchema.pre('save', async function () {

    // Nếu mật khẩu không thay đổi thì bỏ qua
    if (!this.isModified('password')) {
        return;
    }

    // Tạo Salt với 10 vòng
    const salt = await bcrypt.genSalt(10);

    // Mã hóa mật khẩu
    this.password = await bcrypt.hash(this.password, salt);
});

// Kiểm tra mật khẩu khi đăng nhập
userSchema.methods.matchPassword = async function (enteredPassword) {

    return await bcrypt.compare(
        enteredPassword,
        this.password
    );

};

module.exports = mongoose.model('User', userSchema);
