import Pelanggan from "../models/PelangganModel.js";
import argon2 from "argon2";
import {Op} from "sequelize";

export const getPelanggans = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search_query || "";
        const offset = limit * page;

        // Hitung total baris berdasarkan kueri pencarian
        const totalRows = await Pelanggan.count({
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
        const result = await Pelanggan.findAll({
            attributes: ['uuid','kode_pelanggan', 'name', 'telp', 'gender', 'alamat'],
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


export const getPelanggansById = async(req, res) =>{
    try {
        const response = await Pelanggan.findOne({
            attributes: ['uuid', 'kode_pelanggan', 'name', 'telp', 'gender', 'alamat'],
            where: {
                uuid: req.params.id
            }
    });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const createPelanggan = async (req, res) => {
    const { name, telp, gender, alamat } = req.body;
    try {
        const lastPelanggan = await Pelanggan.findOne({ order: [['createdAt', 'DESC']] });

        let newCode;
        if (!lastPelanggan) {
            newCode = 'AC000001';
        } else {
            const lastCode = lastPelanggan.kode_pelanggan;
            const num = parseInt(lastCode.substring(2)) + 1;
            newCode = 'AC' + num.toString().padStart(6, '0');
        }

        await Pelanggan.create({
            kode_pelanggan: newCode,
            name: name,
            telp: telp,
            gender: gender,
            alamat: alamat
        });

        res.status(201).json({ msg: "Berhasil Menambahkan Pelanggan" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}

export const updatePelanggan = async (req, res) =>{
    const pelanggan = await Pelanggan.findOne({
            where: {
                uuid: req.params.id
            }
    });
    if(!pelanggan) return res.status(404).json({msg: "Pelanggan tidak ditemukan"});
    const {name, telp, gender, alamat} = req.body;
    try {
        await Pelanggan.update({
            name: name,
            telp: telp,
            gender: gender,
            alamat: alamat
        }, {
            where: {
                id: pelanggan.id
            }
        });
        res.status(201).json({msg: "Pelanggan Updated"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}

export const deletePelanggan = async(req, res) =>{
    const pelanggan = await Pelanggan.findOne({
            where: {
                uuid: req.params.id
            }
    });
    if(!pelanggan) return res.status(404).json({msg: "Pelanggan tidak ditemukan"});
    try {
        await Pelanggan.destroy({
            where: {
                id: pelanggan.id
            }
        });
        res.status(201).json({msg: "Pelanggan Deleted"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}