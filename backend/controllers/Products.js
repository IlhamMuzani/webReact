import { json, where } from "sequelize";
import Product from "../models/ProductModel.js";
import User from "../models/UserModel.js";
import {Op} from "sequelize";
import path from "path";
import fs from "fs";

export const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search_query || "";
        const offset = limit * page;
        let whereCondition = {
            [Op.or]: [
                { name: { [Op.like]: '%' + search + '%' } },
                { price: { [Op.like]: '%' + search + '%' } }
            ]
        };

        if (req.role === "admin") {
            const totalRows = await Product.count({
                where: whereCondition
            });

            const totalPage = Math.ceil(totalRows / limit);

            const result = await Product.findAll({
                attributes: ['uuid', 'name', 'price', 'price_dus', 'price_renceng', 'price_pack', 'satuan', 'jumlah', 'keterangan', 'url', 'image'],
                include: [{
                    model: User,
                    attributes: ['name', 'email']
                }],
                where: whereCondition,
                offset: offset,
                limit: limit,
                order: [['id', 'DESC']]
            });

            res.status(200).json({
                result: result,
                page: page,
                limit: limit,
                totalRows: totalRows,
                totalPage: totalPage
            });
        } else {
            whereCondition.userId = req.userId;
            const totalRows = await Product.count({
                where: whereCondition
            });

            const totalPage = Math.ceil(totalRows / limit);

            const result = await Product.findAll({
                attributes: ['uuid', 'name', 'price', 'price_dus', 'price_renceng', 'price_pack', 'satuan', 'jumlah', 'keterangan', 'url', 'image'],
                where: whereCondition,
                include: [{
                    model: User,
                    attributes: ['name', 'email']
                }],
                offset: offset,
                limit: limit,
                order: [['id', 'DESC']]
            });

            res.status(200).json({
                result: result,
                page: page,
                limit: limit,
                totalRows: totalRows,
                totalPage: totalPage
            });
        }
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const getProductById = async (req, res) =>{
    try {
        const product = await Product.findOne({
            where: {
                uuid: req.params.id
            }
        });
        if(!product) return res.status(404),json({msg: "Data tidak ditemuakan"});
        let response;
        if(req.role ==="admin"){
            response = await Product.findOne({
                attributes: ['uuid', 'name', 'price', 'price_dus', 'price_renceng', 'price_pack', 'satuan', 'jumlah', 'keterangan', 'url', 'image'],
                where: {
                id: product.id
                },
                include:[{
                    model: User,
                    attributes :['name', 'email']
                }]
            });
        }else{
            response = await Product.findOne({
                attributes: ['uuid', 'name', 'price', 'price_dus', 'price_renceng', 'price_pack', 'satuan', 'jumlah', 'keterangan', 'url', 'image'],
                where:{
                    [Op.and]:[{id: product.id}, {userId: req.userId}]
                },
                include:[{
                    model: User,
                    attributes :['name', 'email']
                }]
            });
        }
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const createProduct = async (req, res) =>{
    let fileName, url;
    if (!req.files || req.files.file === undefined) {
        // Jika tidak ada file yang diunggah, atur image dan url menjadi null
        fileName = null;
        url = null;
    } else {
        // Jika ada file yang diunggah, proses seperti biasa
        const file = req.files.file;
        const fileSize = file.data.length;
        const ext = path.extname(file.name);
        fileName = file.md5 + ext;
        url = `${req.protocol}://${req.get("host")}/images/${fileName}`;

        const allowedType = ['.png','.jpg','.jpeg'];
        if (!allowedType.includes(ext.toLowerCase())) return res.status(422).json({msg: "Invalid Images"});
        if (fileSize > 5000000) return res.status(422).json({msg: "Image must be less than 5 MB"});

        file.mv(`./public/images/${fileName}`, async(error) =>{
            if(error) return res.status(500).json({msg: error.message});
        });
    }

    try {
        await Product.create({
            name: req.body.name,
            price: req.body.price,
            price_renceng: req.body.price_renceng,
            price_dus: req.body.price_dus,
            price_pack: req.body.price_pack,
            jumlah: req.body.jumlah,
            satuan: req.body.satuan,
            keterangan: req.body.keterangan,
            userId: req.userId,
            image: fileName,
            url: url
        });
        res.status(201).json({msg: "Product Created Successfully"});
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: {
                uuid: req.params.id
            }
        });

        if (!product) {
            return res.status(404).json({ msg: "Data tidak ditemukan" });
        }

        const { name, price, price_dus, price_renceng, price_pack, jumlah, satuan, keterangan } = req.body;
        let fileName = product.image;

        // Admin dapat mengubah gambar produk
        if (req.role === "admin") {
            // Cek apakah ada file yang diunggah
            if (req.files !== null && req.files.file !== undefined) {
                const file = req.files.file;
                const fileSize = file.data.length;
                const ext = path.extname(file.name);
                fileName = file.md5 + ext;

                const allowedType = ['.png', '.jpg', '.jpeg'];

                if (!allowedType.includes(ext.toLowerCase())) {
                    return res.status(422).json({ msg: "Invalid Images" });
                }

                if (fileSize > 5000000) {
                    return res.status(422).json({ msg: "Image must be less than 5 MB" });
                }

                // Jika produk awalnya memiliki gambar, hapus gambar lama
                if (product.image) {
                    const filepath = `./public/images/${product.image}`;
                    fs.unlinkSync(filepath);
                }

                try {
                    await file.mv(`./public/images/${fileName}`);
                } catch (error) {
                    return res.status(500).json({ msg: error.message });
                }
            }
        } else {
            // Non-admin dapat mengubah nama dan harga
            // Jika produk memiliki gambar null atau pengguna non-admin mengunggah gambar baru,
            // langkah-langkahnya sama dengan admin
            if (!product.image || (req.files !== null && req.files.file !== undefined)) {
                if (req.files !== null && req.files.file !== undefined) {
                    const file = req.files.file;
                    const fileSize = file.data.length;
                    const ext = path.extname(file.name);
                    fileName = file.md5 + ext;

                    const allowedType = ['.png', '.jpg', '.jpeg'];

                    if (!allowedType.includes(ext.toLowerCase())) {
                        return res.status(422).json({ msg: "Invalid Images" });
                    }

                    if (fileSize > 5000000) {
                        return res.status(422).json({ msg: "Image must be less than 5 MB" });
                    }

                    try {
                        await file.mv(`./public/images/${fileName}`);
                    } catch (error) {
                        return res.status(500).json({ msg: error.message });
                    }
                }
            } else {
                // Non-admin tidak diizinkan mengubah gambar
                fileName = product.image;
            }
        }

        // Bangun URL baru berdasarkan fileName
        const url = fileName ? `${req.protocol}://${req.get("host")}/images/${fileName}` : null;

        // Update produk dengan data yang diberikan
        await Product.update({ name, price, price_renceng, price_dus, price_pack, satuan, jumlah, keterangan, image: fileName, url: url }, {
            where: {
                [Op.and]: [{ id: product.id }, { userId: req.userId }]
            }
        });

        res.status(200).json({ msg: "Product updated successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: {
                uuid: req.params.id
            }
        });
        if (!product) return res.status(404).json({ msg: "Data tidak ditemukan" });

        if (req.role === "admin") {
            const filepath = `./public/images/${product.image}`;
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
            await Product.destroy({
                where: {
                    id: product.id
                }
            });
        } else {
            if (req.userId !== product.userId) return res.status(403).json({ msg: "Akses Terlarang" });
            const filepath = `./public/images/${product.image}`;
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
            await Product.destroy({
                where: {
                    [Op.and]: [{ id: product.id }, { userId: req.userId }]
                }
            });
        }
        res.status(200).json({ msg: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};


export const updateProductJumlah = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: {
                uuid: req.params.id
            }
        });

        if (!product) {
            return res.status(404).json({ msg: "Data tidak ditemukan" });
        }

        const { jumlah } = req.body;

        // Periksa apakah pengguna memiliki izin untuk mengubah nama produk
        if (req.role !== "admin" && req.userId !== product.userId) {
            return res.status(403).json({ msg: "Akses Terlarang" });
        }

        // Update nama produk
        await Product.update({ jumlah }, {
            where: {
                uuid: req.params.id
            }
        });

        res.status(200).json({ msg: "Nama produk berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
