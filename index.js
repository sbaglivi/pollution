const express = require("express");
const app = express();
app.set("view engine", "ejs");
app.get("/", (req, res) => {
  res.render("home");
});
app.get("/submit", (req,res)=>{
  res.render("submit");
})
app.post("/submit", (req,res)=>{
  // Handle submit
})
app.get("/pollution", (req,res)=>{
  // shows a map with points wherever pollution has been signaled.
})
app.get("*", (req, res) => {
  res.send("You've reached a dead end");
});
app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
