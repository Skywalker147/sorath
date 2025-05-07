const app = require('./app');
const port = process.env.PORT || 4000;

// app.listen(port,  async () => {
//   console.log(`🚀 Server listening on http://82.29.164.109:${port}`);
// });


app.listen(port, '82.29.164.109', async () => {
  console.log(`🚀 Server listening on http://82.29.164.109:${port}`);
});


