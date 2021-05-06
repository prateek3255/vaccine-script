const axios = require("axios");
const puppeteer = require("puppeteer");
const dotenv = require("dotenv").config();

function pad(s: number) {
  return s < 10 ? "0" + s : s;
}

const vaccineNotifier = async (pincode: string, chat_id: string, aboveEighteenOnly: boolean = false) => {
  try {
    const dateObj = new Date();
    const today = [
      pad(dateObj.getDate()),
      pad(dateObj.getMonth() + 1),
      dateObj.getFullYear(),
    ].join("-");

    const { data } = await axios({
      method: "get",
      url: `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${today}`,
      headers: {
        authority: "cdn-api.co-vin.in",
        "sec-ch-ua":
          '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
        accept: "application/json",
        "accept-language": "hi_IN",
        "sec-ch-ua-mobile": "?0",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
        origin: "https://apisetu.gov.in",
        "sec-fetch-site": "cross-site",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        referer: "https://apisetu.gov.in/public/marketplace/api/cowin",
      },
    });

    const availableSlots = [];

    data?.centers?.forEach((center) => {
      center?.sessions?.forEach((session) => {
        if (session.available_capacity > 0 && (!aboveEighteenOnly || aboveEighteenOnly && session.min_age_limit <= 18)) {
          availableSlots.push({
            name: center.name,
            date: session.date,
            ageLimit: session.min_age_limit,
            vaccine: session.vaccine,
            capacity: session.available_capacity,
          });
        }
      });
    });

    if (availableSlots.length > 0) {
      const slots = availableSlots.map(
        (slot) =>
          `${slot.capacity} slots for ${slot.vaccine} available at ${slot.name} for ages greater than ${slot.ageLimit} on ${slot.date}`
      );
      const availabilityText = `Vaccine slots available here - \n\n ${slots.join(
        "\n\n"
      )}`;
      console.log("Slots available");
      await axios.post(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${chat_id}&text=${availabilityText}`
      );
      console.log("Message sent", pincode);
    } else {
      console.log("No slots found for", pincode);
    }
  } catch (error) {
    console.log(error);
  }
};

setInterval(() => {
  vaccineNotifier("342005", "746812110");
  vaccineNotifier("301001", "1280739075", true);
}, 5 * 60 * 1000)


