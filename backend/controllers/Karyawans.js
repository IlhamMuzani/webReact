import Karyawan from "../models/KaryawanModel.js";
import argon2 from "argon2";
import {Op} from "sequelize";

export const getKaryawans = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search_query || "";
        const offset = limit * page;

        // Hitung total baris berdasarkan kueri pencarian
        const totalRows = await Karyawan.count({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: '%' + search + '%' } },
                    { telp: { [Op.like]: '%' + search + '%' } }
                ]
            }
        });

        // Hitung total halaman berdasarkan jumlah baris dan batasan halaman
        const totalPage = Math.ceil(totalRows / limit);

        // Ambil data pengguna dengan kueri pencarian, limit, offset, dan urutan
        const result = await Karyawan.findAll({
            attributes: ['uuid','kode_karyawan', 'name', 'telp', 'gender', 'alamat'],
            where: {
                [Op.or]: [
                    { name: { [Op.like]: '%' + search + '%' } },
                    { telp: { [Op.like]: '%' + search + '%' } }
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


export const getKaryawansById = async(req, res) =>{
    try {
        const response = await Karyawan.findOne({
            attributes: ['uuid', 'kode_karyawan', 'name', 'telp', 'gender', 'alamat'],
            where: {
                uuid: req.params.id
            }
    });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const createKaryawan = async (req, res) => {
    const { name, telp, gender, alamat } = req.body;
    try {
        const lastKaryawan = await Karyawan.findOne({ order: [['createdAt', 'DESC']] });

        let newCode;
        if (!lastKaryawan) {
            newCode = 'AA000001';
        } else {
            const lastCode = lastKaryawan.kode_karyawan;
            const num = parseInt(lastCode.substring(2)) + 1;
            newCode = 'AA' + num.toString().padStart(6, '0');
        }

        await Karyawan.create({
            kode_karyawan: newCode,
            name: name,
            telp: telp,
            gender: gender,
            alamat: alamat
        });

        res.status(201).json({ msg: "Berhasil Menambahkan Karyawan" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}

export const updateKaryawan = async (req, res) =>{
    const karyawan = await Karyawan.findOne({
            where: {
                uuid: req.params.id
            }
    });
    if(!karyawan) return res.status(404).json({msg: "Karyawan tidak ditemukan"});
    const {kode_karyawan, name, telp, gender, alamat} = req.body;
    try {
        await Karyawan.update({
            kode_karyawan: kode_karyawan,
            name: name,
            telp: telp,
            gender: gender,
            alamat: alamat
        }, {
            where: {
                id: karyawan.id
            }
        });
        res.status(201).json({msg: "Karyawan Updated"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}

export const deleteKaryawan = async(req, res) =>{
    const karyawan = await Karyawan.findOne({
            where: {
                uuid: req.params.id
            }
    });
    if(!karyawan) return res.status(404).json({msg: "Karyawan tidak ditemukan"});
    try {
        await Karyawan.destroy({
            where: {
                id: karyawan.id
            }
        });
        res.status(201).json({msg: "Karyawan Deleted"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}