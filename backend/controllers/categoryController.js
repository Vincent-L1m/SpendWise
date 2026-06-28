const categoryRepo = require("../repositories/categoryRepository");
const response     = require("../utils/response");
const STATUS       = require("../constants/httpStatus");

const ICON_OPTIONS = [
  "tag","coffee","truck","shopping-bag","heart","film","book","file-text",
  "home","zap","briefcase","gift","code","trending-up","more-horizontal",
  "music","camera","globe","phone","sun","moon","star","smile","map-pin",
  "package","scissors","tool","umbrella","watch","wifi"
];

const getAll = async (req,res,next) => {
  try {
    const categories = await categoryRepo.findAllByUser(req.user.id, req.query.type);
    return response.success(res,"Kategori berhasil diambil.",categories);
  } catch(e){ next(e); }
};

const create = async (req,res,next) => {
  try {
    const { name, type, icon, color } = req.body;
    if (!name?.trim()) return response.error(res,"Nama kategori wajib diisi.",STATUS.BAD_REQUEST);
    if (!["income","expense","both"].includes(type))
      return response.error(res,"Tipe tidak valid.",STATUS.BAD_REQUEST);
    const id = await categoryRepo.create({ userId:req.user.id, name:name.trim(), type, icon, color });
    const cat = await categoryRepo.findById(id);
    return response.success(res,"Kategori berhasil dibuat.",cat,STATUS.CREATED);
  } catch(e){ next(e); }
};

const update = async (req,res,next) => {
  try {
    const { name, type, icon, color } = req.body;
    if (!name?.trim()) return response.error(res,"Nama kategori wajib diisi.",STATUS.BAD_REQUEST);
    const ok = await categoryRepo.update(req.params.id, req.user.id, { name:name.trim(), type, icon, color });
    if (!ok) return response.error(res,"Kategori tidak ditemukan atau bukan milik kamu.",STATUS.NOT_FOUND);
    const cat = await categoryRepo.findById(req.params.id);
    return response.success(res,"Kategori berhasil diperbarui.",cat);
  } catch(e){ next(e); }
};

const remove = async (req,res,next) => {
  try {
    const ok = await categoryRepo.remove(req.params.id, req.user.id);
    if (!ok) return response.error(res,"Kategori tidak ditemukan atau tidak bisa dihapus.",STATUS.NOT_FOUND);
    return response.success(res,"Kategori berhasil dihapus.");
  } catch(e){ next(e); }
};

module.exports = { getAll, create, update, remove, ICON_OPTIONS };
