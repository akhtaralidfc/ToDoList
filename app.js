//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _=require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongoose.connect('mongodb://localhost:27017/todoListDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect("mongodb+srv://akhtar-admin:pulsar150@atlascluster.ux104bi.mongodb.net/todoListDB", {useNewUrlParser: true, useUnifiedTopology: true})
//item  document containig just a name
const itemSchema = new mongoose.Schema({ //schema
  name: String
});
//List document conataining a name and an array of documetns of item
const listSchema=new mongoose.Schema({
  name: String,
  //An array of documents of item
  items: [itemSchema]
})
const List=mongoose.model("List",listSchema);
const Item=mongoose.model("Item",itemSchema);

const item1=new Item({name:"Welcome to ToDoList"});
const item2=new Item({name: "Hit the + button to insert an item!"});
const item3=new Item({name: "<-- Hit this to delete an item!"});
const defaultItems=[item1,item2,item3];

app.get("/", function(req, res) {
  Item.find({},function(err,result){
    if(err){
      console.log(err)
    }else{
      if(result.length===0){
        Item.insertMany(defaultItems,(err)=>{ //modelName will call the insertManyMethod
          if(err){
            console.log(err);
          }else{
            console.log("Successfully inserted array into the db!");
          }
        })
      }
      res.render("list", {listTitle: "Today", newListItems: result});
    }
  })
});

app.get("/:customListName",(req,res)=>{
  var customListName=_.capitalize(req.params.customListName);
  List.findOne({name: customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        //if that list doesn't exist initally
        const list=new List({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect("/"+customListName);
      }else{
        //if that list exist already
        res.render("list", {listTitle: customListName, newListItems: foundList.items});
      }
    }
  })

});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName=req.body.list;
  const item=new Item({
    name: itemName
  });
  if(listName==="Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName},function(err,foundList){
        if(err){
          console.log(err);
        }else{
          foundList.items.push(item);
          foundList.save();
          res.redirect("/"+listName);
        }
    })
  }
});
app.post("/delete",(req,res)=>{
  var checkedItemId=(req.body.checkbox);
  //Here we will find the document with the listName and remove the id from that document from the collection
  const listName=req.body.listName;
  if(listName==="Today"){
    Item.findOneAndRemove({_id: checkedItemId},(err)=>{
      if(err){
        console.log(err);
        // res.redirect("/");
      }else{
        // console.log(checkedItemId+"-Successfully deleted from database.");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id:checkedItemId}}},(err,foundList)=>{
      if(!err){
        res.redirect("/"+listName);
      }
    })
  }


})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
