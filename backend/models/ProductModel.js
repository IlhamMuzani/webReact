import { Sequelize, DataTypes } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";

const Products = db.define('product', {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [3, 100]
        }
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    price_dus: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    price_renceng: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    price_pack: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true // Mengizinkan nilai null untuk image
    },
    url: {
        type: DataTypes.STRING,
        allowNull: true // Mengizinkan nilai null untuk url
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    satuan: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [3, 100]
        }
    },
    jumlah: {
        type: DataTypes.INTEGER, // Atau DataTypes.FLOAT jika ingin mendukung bilangan desimal
        allowNull: false,
        validate: {
            isInt: {
                msg: "Jumlah harus berupa bilangan bulat"
            }
        }
    },
    keterangan: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [0, 100]
        }
    },
}, {
    freezeTableName: true
});

Users.hasMany(Products);
Products.belongsTo(Users, { foreignKey: 'userId' });

export default Products;
