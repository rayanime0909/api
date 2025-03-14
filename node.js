const url = "http://192.168.167.51:3000/seasons";
const ids = [
  30, 95, 1530, 30123, 22319, 43299, 50461, 379, 35120, 54275, 323, 6, 1887,
  40571, 245, 318, 51122, 54492, 20, 238, 198, 25013, 32615, 22101, 30123, 283,
  41120, 11617, 75, 3572, 57, 11617, 156, 1002, 1281, 20, 34799, 488, 218, 1629,
  6594, 427, 777, 343, 1230, 9539, 10257, 435, 12189, 14131, 11013, 15809,
  24765, 28907, 25835, 22729, 21325, 14355, 186, 96, 7647, 18119, 47917, 10793,
  32182, 58, 24439, 267, 12445, 5941, 14811, 1606, 150, 1312, 289, 3974, 6956,
  2337, 239, 1690, 16706, 400, 2026, 2993, 691, 6802, 440, 40974, 249, 9756,
  35507, 1177, 937, 853, 23273, 153, 145, 35839, 33573, 1535,
];

const batchSize = 1; 
const createBatches = (array, size) => {
  const batches = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
};

const batches = createBatches(ids, batchSize);

const sendBatch = async (batch) => {
  const requestBody = {
    animeId: batch,
    publisherId: "Ssnn7HQo5fXYbl5OOp46Gvpu48u2",
    summary: "A brief description of the season",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Batch Success:", data);
  } catch (error) {
    console.log("Sending batch:", batch);
    console.log("Request body:", requestBody);
  }
};

const processBatches = async () => {
  for (const batch of batches) {
    await sendBatch(batch);
  }
  console.log("All batches processed successfully.");
};

processBatches();
