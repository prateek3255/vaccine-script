const axios = require("axios");
const dotenv = require("dotenv").config();

function pad(s: number) {
  return s < 10 ? "0" + s : s;
}

const data = [
  {
    pincode: "301001",
    chats: [
      {
        name: "Divyansh",
        id: "1280739075",
      },
      {
        name: "Nupur",
        id: "954276961",
      },
    ],
    aboveEighteenOnly: true,
  },
  {
    pincode: "307026",
    chats: [
      {
        name: "Mansi",
        id: "1485876940",
      },
      {
        name: "Mansi 2",
        id: "1122056957",
      },
    ],
    aboveEighteenOnly: false,
  },
  {
    pincode: "342005",
    chats: [
      {
        name: "Prateek",
        id: "746812110",
      },
    ],
    aboveEighteenOnly: true,
  },
];

const vaccineNotifier = async (
  pincode: string,
  chats: string[],
  aboveEighteenOnly: boolean = false
) => {
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
        if (
          session.available_capacity >= 1 &&
          (!aboveEighteenOnly ||
            (aboveEighteenOnly && session.min_age_limit <= 18))
        ) {
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
      console.log(availableSlots);
      const slots = availableSlots.map(
        (slot) =>
          `${slot.capacity} slots for ${slot.vaccine} available at ${slot.name} for ages greater than ${slot.ageLimit} on ${slot.date}`
      );

      const availabilityText = `Vaccine slots available here - \n\n ${slots.join(
        "\n\n"
      )}
      
      Don't forget to thank Prateek ;)
      `;

      console.log("Slots available");
      const promises = chats.map((chat_id) =>
        axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${chat_id}&text=${availabilityText}`
        )
      );
      await Promise.all(promises);

      console.log("Message sent", pincode);
    } else {
      console.log("No slots found for", pincode);
    }
  } catch (error) {
    console.log(error);
  }
};

data.forEach(item => {
  vaccineNotifier(item.pincode, item.chats.map(chat => chat.id), item.aboveEighteenOnly);
})

setInterval(() => {
  data.forEach(item => {
    vaccineNotifier(item.pincode, item.chats.map(chat => chat.id), item.aboveEighteenOnly);
  })
}, 2 * 60 * 1000);
