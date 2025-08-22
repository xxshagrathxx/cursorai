import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

admin.initializeApp();

export const sendDailyFollowUpNotification = onRequest(async (req, res) => {
  // Optional: Basic security so random people can't trigger it
  const secretKey = process.env.CRON_SECRET || "mysecret123";
  if (req.query.key !== secretKey) {
    res.status(403).send("Forbidden");
    return;
  }

  const db = admin.firestore();
  const today = new Date().toISOString().split("T")[0];

  // Get all device tokens
  const tokensSnapshot = await db.collection("deviceTokens").get();

  for (const tokenDoc of tokensSnapshot.docs) {
    const userId = tokenDoc.id;
    const token = tokenDoc.data().token;

    // Get follow-ups due today
    const followUpsQuery = db
      .collection("followups")
      .where("userId", "==", userId)
      .where("scheduledDate", "==", today)
      .where("status", "in", ["pending", "overdue"]);

    const followUpsSnapshot = await followUpsQuery.get();
    if (followUpsSnapshot.empty) continue;

    const count = followUpsSnapshot.size;

    // Send notification
    const message = {
      notification: {
        title: "Daily Follow-ups Reminder",
        body: `You have ${count} follow-up(s) due today.`,
      },
      data: {
        route: "/followups",
      },
      token,
    };

    try {
      await admin.messaging().send(message);
      logger.info(`Sent notification to user ${userId}`);
    } catch (error) {
      logger.error(`Error sending notification to ${userId}:`, error);
    }
  }

  res.send("Follow-up notifications sent successfully");
});
