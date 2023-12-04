const fetch = require("node-fetch");
const FormData = require("form-data");
const { User } = require("../models/user");
const { Order } = require("../models/order");
const config = require("config");

module.exports.initPayment = async (req, res) => {
  // Find the user by their user ID from the authenticated request
  let user = await User.findById(req.user._id);

  // If no user is found, return a 400 Bad Request error response
  if (!user) return res.status(400).send({ error: "Invalide Id" });

  // Find the user's default address from their addresses
  let userDefaultAddress = user.addressess.find((item) => {
    return item._id.equals(user.defaultAddress);
  });

  // Find the order by its ID from the request parameters
  let order = await Order.findById(req.params.orderId);

  // If no order is found, return a 400 Bad Request error response
  if (!order) return res.status(400).send({ error: "Invalide Order ID" });

  // Generate a unique transaction ID for the payment
  const tran_id =
    "_" + Math.random().toString(36).substring(2, 9) + new Date().getTime();

  //local backend has URL = http://localhost:3001 but Production URL is = https://....com/
  //It create conflict
  let BackEndURL = config.get("URL");
  BackEndURL = BackEndURL.endsWith("/") ? BackEndURL : BackEndURL + "/";
  // Define payment data for SSLCommerz integration

  const payData = {
    store_id: config.get("SSLCOMMERZ_STORE_ID"),
    store_passwd: config.get("SSLCOMMERZ_STORE_PASSWD"),

    total_amount: order.amount,
    currency: "BDT",
    tran_id: tran_id,
    multi_card_name: "mobilebank",
    success_url: `${BackEndURL}api/payments/paymentSuccess`,
    fail_url: `${BackEndURL}api/payments/paymentFail`,
    cancel_url: `${BackEndURL}api/payments/paymentCancel`,

    shipping_method: order.category,
    product_name: order.brand,
    product_category: order.categoryType,
    product_profile: "general",
    // Customer information
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
    // Shipping information
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
    // Create a new FormData object and append payment data to it
    let fdata = new FormData();
    for (let key in payData) {
      fdata.append(key, payData[key]);
    }

    // Make a POST request to the SSLCommerz gateway for payment processing
    const response = await fetch(
      "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
      {
        method: "POST",
        body: fdata,
      }
    );
    // Parse the response JSON data
    const data = await response.json();

    // If the payment status is "SUCCESS," send the Gateway Page URL as a response
    if (data.status === "SUCCESS") {
      return res.send({
        success: "Gateway Page URL is fatched successfully",
        data: data.GatewayPageURL,
      });
    } else {
      // If the payment fails, return a generic "Failed to payment" response
      return res.send("Failed to payment");
    }
  } catch (error) {
    // Handle any errors that occur during the payment process
    console.log(
      "🚀 ~ file: paymentController.js:67 ~ module.exports.initPayment= ~ error",
      error
    );
  }

  return res.send("Failed to payment");
};
