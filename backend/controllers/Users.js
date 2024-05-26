import User from "../models/UserModel.js";
import argon2 from "argon2";
import {Op} from "sequelize";

export const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search_query || "";
        const offset = limit * page;

        // Hitung total baris berdasarkan kueri pencarian
        const totalRows = await User.count({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: '%' + search + '%' } },
                    { kode_user: { [Op.like]: '%' + search + '%' } }
                ]
            }
        });

        // Hitung total halaman berdasarkan jumlah baris dan batasan halaman
        const totalPage = Math.ceil(totalRows / limit);

        // Ambil data pengguna dengan kueri pencarian, limit, offset, dan urutan
        const result = await User.findAll({
            attributes: ['uuid', 'name', 'kode_user', 'role'],
            where: {
                [Op.or]: [
                    { name: { [Op.like]: '%' + search + '%' } },
                    { kode_user: { [Op.like]: '%' + search + '%' } }
                ]
            },
            offset: offset,
            limit: limit,
            order: [['id', 'DESC']]
        });

        // Kirim respons dengan data pengguna, informasi halaman, dan total baris
        res.status(200).json({
            result: result,
            page: page,
            limit: limit,
            totalRows: totalRows,
            totalPage: totalPage
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};


export const getUserstById = async(req, res) =>{
    try {
        const response = await User.findOne({
            attributes:['uuid','name','kode_user','role'],
            where: {
                uuid: req.params.id
            }
    });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const createUser = async (req, res) => {
    const { karyawanId, name, password, confPassword, role } = req.body;
    
    // Validasi kesesuaian password
    if (password !== confPassword) {
        return res.status(400).json({ msg: "Password dan Password Konfirmasi tidak cocok" });
    }

    try {
        // Fetch the last created user
        const lastUser = await User.findOne({ order: [['createdAt', 'DESC']] });

        // Generate new kode_user
        let newCode;
        if (!lastUser || !lastUser.kode_user) {
            newCode = 'AB000001';
        } else {
            const lastCode = lastUser.kode_user;
            const num = parseInt(lastCode.substring(2)) + 1;
            newCode = 'AB' + num.toString().padStart(6, '0');
        }

        // Create new user with generated kode_user and null password
        await User.create({
            karyawanId: karyawanId,
            kode_user: newCode,
            name: name,
            password: null, // Kosongkan password
            role: role
        });

        res.status(201).json({ msg: "Register Berhasil" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};



export const updateUser = async (req, res) =>{
    const user = await User.findOne({
            where: {
                uuid: req.params.id
            }
    });
    if(!user) return res.status(404).json({msg: "User tidak ditemukan"});
        const {name, email, password, confPassword, role} = req.body;
        let hashPassword;
        if(password === "" || password === null)
        {
            hashPassword = user.password
        }else{
            hashPassword = await argon2.hash(password);
        }
        if(password !== confPassword) return res.status(400).json({msg: "Password dan Password Konfirmasi tidak cocok"});
    try {
        await User.update({
            name: name,
            email: email,
            password: hashPassword,
            role: role
        }, {
            where: {
                id: user.id
            }
        });
        res.status(201).json({msg: "User Updated"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}


export const deleteUser = async(req, res) =>{
    const user = await User.findOne({
            where: {
                uuid: req.params.id
            }
    });
    if(!user) return res.status(404).json({msg: "User tidak ditemukan"});
    try {
        await User.destroy({
            where: {
                id: user.id
            }
        });
        res.status(201).json({msg: "User Deleted"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}