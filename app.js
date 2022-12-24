const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

mongoose.set("strictQuery", false);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded( { extended: true } ));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = new mongoose.Schema( { name: String } );

const Item = mongoose.model("Items", itemsSchema);

const defaultItems = [
    new Item(
      {
        name: "Welcome to your todo list!"
      }
    ),
    Item(
      {
        name: "Hit the + button to add a new item"
      }
    ),
    Item(
      {
        name: "<-- Hit this to delete an item"
      }
    )
  ];

const listSchema = new mongoose.Schema(
  {
    name: String,
    items: [itemsSchema]
  }
);

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find(function (err, results) {
    if (results.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved documents to database.");
        }
      });
    }
    res.render("list", { listTitle: "Today", newListItems: results });
  });
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item( { name: itemName } );

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne(
      {
        name: listName
      },
      function (err, results) {
        results.items.push(newItem);
        results.save();
        res.redirect("/" + listName);
      }
    );
    // res.redirect("/" + listName);
  }
});

app.post("/delete", function (req, res) {
  const deletedItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(deletedItem, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted!");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      {
        $pull: {
          items: { _id: deletedItem }
        }
      },
      function (err, results) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
  // Delete item from Database

});

// app.get("/work", function(req,res) {
//   res.render("list", { listTitle: "Work List", newListItems: workItems } );
// });

app.get("/about", function(req, res) {
  res.render("about");
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, results) {
    if (err) {
      console.log(err);
    } else {
      if (results) {
        res.render("list", { listTitle: results.name, newListItems: results.items } );
      } else {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
    }
  });
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
