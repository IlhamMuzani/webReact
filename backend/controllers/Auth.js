import User from "../models/UserModel.js";
import argon2 from "argon2";

export const Login = async (req, res) => {
    const user = await User.findOne({
        where: {
            kode_user: req.body.kode_user
        }
    });
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
    const match = await argon2.verify(user.password, req.body.password);
    if (!match) return res.status(400).json({ msg: "Wrong Password" });
    req.session.userId = user.uuid;
    const { uuid, name, kode_user, role } = user;
    res.status(200).json({ uuid, name, kode_user, role });
}

export const Me = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ msg: "Mohon login ke akun Anda!" });
    }
    const user = await User.findOne({
        attributes: ['uuid', 'name', 'kode_user', 'role'],
        where: {
            uuid: req.session.userId
        }
    });
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
    res.status(200).json(user);
}

export const registerWithKodeUser = async (req, res) => {
    const { kode_user, password, confPassword } = req.body;

    if (!kode_user) {
        return res.status(400).json({ msg: "Kode user diperlukan" });
    }

    if (password !== confPassword) {
        return res.status(400).json({ msg: "Password dan Password Konfirmasi tidak cocok" });
    }

    try {
        const user = await User.findOne({ where: { kode_user: kode_user } });

        if (!user) {
            return res.status(404).json({ msg: "Kode user tidak ditemukan" });
        }

        if (user.password) {
            return res.status(400).json({ msg: "Anda sudah terdaftar" });
        }

        const hashPassword = await argon2.hash(password);

        await User.update(
            { password: hashPassword },
            { where: { id: user.id } }
        );

        res.status(200).json({ msg: "Registrasi berhasil" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const logOut = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(400).json({ msg: "Tidak dapat logout" });
        res.status(200).json({ msg: "Anda telah logout" });
    });
}
