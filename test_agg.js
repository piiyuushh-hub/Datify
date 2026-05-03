const mongoose = require('mongoose');

async function test() {
    await mongoose.connect('mongodb://localhost:27017/omnidata');
    const Prediction = require('../node_backend/models/Prediction');
    const userId = '69f6364f8af464d7861b6fbf'; 
    
    try {
        const cityData = await Prediction.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: '$inputs.city', avgData: { $avg: '$predicted_data_used_gb' } } },
            { $sort: { '_id': 1 } }
        ]);
        console.log('CityData:', cityData);
    } catch(e) {
        console.error('Error in city:', e.message);
    }

    try {
        const salaryData = await Prediction.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { 
                $bucket: {
                    groupBy: "$inputs.estimated_salary",
                    boundaries: [0, 40000, 60000, 80000, 100000, 120000, 150000],
                    default: "150k+",
                    output: {
                        avgData: { $avg: "$predicted_data_used_gb" },
                        count: { $sum: 1 }
                    }
                }
            }
        ]);
        console.log('SalaryData:', salaryData);
    } catch(e) {
        console.error('Error in salary:', e.message);
    }

    mongoose.disconnect();
}
test();
