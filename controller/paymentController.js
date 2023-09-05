const fetch = require("node-fetch");
const FormData = require("form-data");
const { User } = require("../models/user");
const { Order } = require("../models/order");
const config = require("config");

module.exports.initPayment = async (req, res) => {
  let user = await User.findById(req.user._id);
  if (!user) return res.status(400).send({ error: "Invalide Id" });

  let userDefaultAddress = user.addressess.find((item) => {
    return item._id.equals(user.defaultAddress);
  });

  let order = await Order.findById(req.params.orderId);
  if (!order) return res.status(400).send({ error: "Invalide Order ID" });

  const tran_id =
    "_" + Math.random().toString(36).substring(2, 9) + new Date().getTime();

  const payData = {
    store_id: config.get("SSLCOMMERZ_STORE_ID"),
    store_passwd: config.get("SSLCOMMERZ_STORE_PASSWD"),

    total_amount: order.amount,
    currency: "BDT",
    tran_id: tran_id,
    multi_card_name: "mobilebank",
    success_url: `${config.get("URL")}/api/payments/paymentSuccess`,
    fail_url: `${config.get("URL")}/api/payments/paymentFail`,
    cancel_url: `${config.get("URL")}/api/payments/paymentCancel`,

    shipping_method: order.category,
    product_name: order.brand,
    product_category: order.categoryType,
    product_profile: "general",

    cus_name: user.name,
    cus_email: user.email,
    cus_add1: userDefaultAddress.address + ", " + userDefaultAddress.area,
    cus_add2: userDefaultAddress.address + ", " + userDefaultAddress.area,
    cus_city: userDefaultAddress.city,
    cus_state: userDefaultAddress.region,
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: user.phone ? user.phone : " ",
    cus_fax: user.phone ? user.phone : " ",

    ship_name: order.name,
    ship_add1: order.address,
    ship_add2: order.address,
    ship_city: "Dhaka",
    ship_state: "Dhaka",
    ship_postcode: 1000,
    ship_country: "Bangladesh",
    value_a: req.params.orderId,
    value_b: user._id.toString(),
    value_c: "ref003_C",
    value_d: "ref004_D",
  };

  try {
    let fdata = new FormData();
    for (let key in payData) {
      fdata.append(key, payData[key]);
    }

    const response = await fetch(
      "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
      {
        method: "POST",
        body: fdata,
      }
    );
    const data = await response.json();

    if (data.status === "SUCCESS") {
      return res.send({
        success: "Gateway Page URL is fatched successfully",
        data: data.GatewayPageURL,
      });
    } else {
      return res.send("Failed to payment");
    }
  } catch (error) {
    console.log(
      "🚀 ~ file: paymentController.js:67 ~ module.exports.initPayment= ~ error",
      error
    );
  }

  return res.send("Failed to payment");
};
