const app = require('./app');
const port = process.env.PORT || 4000;



app.listen(port, async () => {
  console.log(`🚀 Server listening on http://localhost:${port}`);
  
});


