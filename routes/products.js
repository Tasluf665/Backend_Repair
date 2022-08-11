const express = require("express");
const Joi = require("joi");
const router = express.Router();
const { Product, validateProduct } = require("../models/product");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.post(
  "/",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const { error } = validateProduct(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    const product = new Product({
      name: req.body.name,
      iconName: req.body.iconName,
      brands: {
        brandName: req.body.brandName,
      },
    });

    await product.save();
    res.send({
      success: "Product is added successfully",
      data: product,
    });
  })
);

router.patch(
  "/addBrands/:id",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const { error } = validateBrand(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send({ error: "Invalide product" });

    product.brands.push({
      brandName: req.body.brandName,
    });

    await product.save();
    res.send({
      success: "Product Brand is added successfully",
      data: product,
    });
  })
);

router.patch(
  "/addModels/:id/:brandId",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const { error } = validateModel(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send({ error: "Invalide product" });

    const brand = await product.brands.id(req.params.brandId);
    if (!brand) return res.status(400).send({ error: "Invalide Brand" });

    brand.models.push({
      modelName: req.body.modelName,
    });

    await product.save();
    res.send({
      success: "Product Model is added successfully",
      data: brand,
    });
  })
);

// router.patch("/addModelsArray/:id/:brandId", auth, async (req, res) => {
//   const product = await Product.findById(req.params.id);
//   if (!product) return res.status(400).send({ error:"Invalide product"});

//   const brand = await product.brands.id(req.params.brandId);
//   if (!brand) return res.status(400).send({ error:"Invalide Brand"});

//   req.body.modelName.map((item) => {
//     brand.models.push({
//       modelName: item.modelName,
//     });
//   });

//   await product.save();
//   res.send({
//     success: "Product array of models is added successfully",
//     data: brand,
//   });
// });

router.get(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    const products = await Product.find().select("-brands -__v");
    if (!products) return res.status(404).send({ error: "Something failed" });

    res.send({
      success: "Product is fetched successfully",
      data: products,
    });
  })
);

router.get(
  "/brands/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    const product = await Product.findById(req.params.id).select("-__v -name");
    if (!product)
      return res.status(404).send({ error: "Product not found with given Id" });

    let result = product.brands.map((item) => {
      let temp = { ...item };
      delete temp._doc.models;
      return temp._doc;
    });

    res.send({
      success: "Product Brand is fetched successfully",
      data: result,
    });
  })
);

router.get(
  "/models/:id/:brandId",
  auth,
  asyncMiddleware(async (req, res) => {
    const product = await Product.findById(req.params.id).select("-__v -name");
    if (!product)
      return res.status(404).send({ error: "Product not found with given Id" });

    const brand = await product.brands.id(req.params.brandId);
    if (!brand) return res.status(400).send({ error: "Invalide Brand" });

    res.send({
      success: "Data fetch successfully",
      data: brand.models,
    });
  })
);

function validateBrand(brand) {
  const schema = Joi.object({
    brandName: Joi.string().min(1).max(255).required(),
  });

  return schema.validate(brand);
}

function validateModel(model) {
  const schema = Joi.object({
    modelName: Joi.string().min(1).max(255).required(),
  });

  return schema.validate(model);
}

module.exports = router;
