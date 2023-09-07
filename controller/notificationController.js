const fetch = require("node-fetch");

//Send a push notification using Expo's API.
module.exports.sendPushNotification = async (
  user,
  statusState,
  statusDetails
) => {
  const pushData = {
    to: user.expoPushToken,
    title: statusState,
    body: statusDetails,
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pushData),
    });

    // Check the response status and handle it as needed
    if (response.ok) {
      console.log("Push notification sent successfully.");
    } else {
      console.error("Failed to send push notification.");
    }
  } catch (error) {
    console.error(
      "An error occurred while sending the push notification:",
      error
    );
  }
};
