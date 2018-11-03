"use strict";
var curSprintCS;
var sprintIDs = ["sprints", "apphead", "today"];
var changesetDetailIDs = ["detail"];
var currentIDs = sprintIDs;
var csCache = [];
var programmedSearches = ["search string", "another string", "..." ];
var retrieve = "retrieving..........";
var retrievingON;

function init() {
   getDirContents("Sprints", getID("sprints"), 0, "expandSprint", false, true);
}
function expandToday() {
   addRetrieving("today");
   var ajax = new XMLHttpRequest();
   ajax.onreadystatechange = function () {
      if (ajax.readyState == 4 && ajax.status == 200) {
         if (ajax.responseText == "success")
            getToday();
         else {
            clearTimeout(retrievingON);
            setInner("retrievetoday", ajax.responseText);
         }
      }
   };
   ajax.open("GET", "changereport?run=retrieveToday", true);
   ajax.send();
}
function addRetrieving(path) {
   var d = document.createElement("DIV");
   d.id = "retrieve" + path;
   d.className = "retrieving";
   getID(path).appendChild(d);
   retrieving(1, "retrieve" + path);
}
function retrieving(index, id) {
   if (index < retrieve.length) {
      getID(id).innerHTML = retrieve.substring(0, index);
      index++;
      retrievingON = setTimeout("retrieving('" + index + "','" + id + "')", 100);
   }
   else
      retrieving(1, id);
}
function getToday() {
   var ajax = new XMLHttpRequest();
   ajax.onreadystatechange = function() {
      if (ajax.readyState == 4 && ajax.status == 200) {
         clearTimeout(retrievingON);
         getID("today").removeChild(getID("retrievetoday"));
         var changesets = JSON.parse(ajax.responseText);
         var path = "changereport/today/today/today";
         csCache["today"] = [];
         csCache["today"][path] = changesets;
         addSearchElement("today");
         createChangesetTable(changesets, path, "tableToday", "left20", getID("today"));
         getID("today").firstChild.href = "javascript:collapseToday('" + path + "')";
         getID("today").firstChild.innerHTML = insImg("collapse");
      }
   };
   ajax.open("GET", "changereport/today/today/today", true);
   ajax.send();
}
function collapseToday() {
   var today = getID("today");
   today.removeChild(getID("tableToday"));
   today.firstChild.href = "javascript:expandToday()";
   today.firstChild.innerHTML = insImg("expand");
   today.removeChild(getID("searchtoday"));
}
function getDirContents(dir, div, cn, func, caching, expcurspr) {
   var ajax = new XMLHttpRequest();
   ajax.onreadystatechange = function () {
      if (ajax.readyState == 4 && ajax.status == 200) {
         if (ajax.responseText.charAt(0) == "<")
            getDirContents(dir, div, 0, func);
         else if (caching) {
            var contents = JSON.parse(ajax.responseText);
            for (var file in contents) {
               var path = dir + "/" + contents[file];
               getID(path).style.color = "gray";
               getJSON(path, 0, 0, true);
            }
         }
         else {
            var contents = JSON.parse(ajax.responseText);
            for (var file in contents) {
               var f = contents[file];
               if (dir == "Sprints") {
                  csCache[f] = [];
               }
               var d = document.createElement("DIV");
               var path = dir + "/" + f;
               d.id = path;
               if (cn)
                  d.className = cn;
               div.appendChild(d);
               var a = createAnchorString(func, path, insImg("expand"));
               setInner(path, a + f);
            }
            if (expcurspr)
               expandSprint("Sprints/" + contents[0]);
         }
      }
   };
   ajax.open("GET", "changereport?dir=" + dir, true);
   ajax.send();
}
function expandSprint(path) {
   addSearchElement(path);
   var sprintID = getID(path);
   var datesDIV = document.createElement("DIV");
   datesDIV.id = "dates" + path;
   getDirContents(path, datesDIV, "left20", "expandDailyChangesets");
   sprintID.appendChild(datesDIV);
   sprintID.firstChild.href = "javascript:collapseSprint('" + path + "')";
   sprintID.firstChild.innerHTML = insImg("collapse");
   getDirContents(path, 0, 0, 0, true);
}
function addSearchElement(path, today) {
   var sprintID = getID(path);
   var searchElement = document.createElement("DIV");
   searchElement.id = "search" + path;
   searchElement.className = "left20";
   sprintID.appendChild(searchElement);
   var input = "<textarea id=\"searchField" + path + "\" cols=\"40\" rows=\"1\" oninput=\"searchSprint('" + path + "')\"></textarea>";
   var filters = insSp(5) + "<select id=\"searchFilter" + path + "\" class=\"up5\" onchange=\"searchFilter('" + path + "')\">";
   filters += "<option value=\"select\">Select Filter...</option>";
   for (var i = 0; i < programmedSearches.length; i++) {
      var filter = programmedSearches[i];
      filters += "<option value=\"" + filter + "\">" + filter + "</option>";
   }
   filters += "</select>";
   var searchResults = "<div id=\"searchResults" + path + "\"></div>";
   setInner("search" + path, input + filters + searchResults);
   getID("searchField" + path).focus();
}
function searchFilter(value) {
   var path = value;
   var searchFilterID = "searchFilter" + path;
   var index = getID(searchFilterID).selectedIndex;
   var options = getID(searchFilterID).options;
   var filter = options[index].value
   if (filter != "select") {
      var searchFieldID = "searchField" + path;
      getID(searchFieldID).value = filter;
      searchSprint(path);
   }
}
function searchSprint(path) {
   var a = performance.now();
   var results = "searchResults" + path;
   setInner(results, "");
   var value = getID("searchField" + path).value;
   if (value != "") {
      var table = "<table class='left20'><tr><th>ChangeSet</th><th>User</th><th>Date</th><th>Comment</th></tr>";
      var sprint;
      if (path == "today")
         sprint = csCache["today"];
      else
         sprint = csCache[path.split("/")[1]];
      var dates = [];
      for (var date in sprint)
         dates.push(date);
      dates.sort().reverse();
      var dlength = dates.length;
      var tablerows = 0;
      for (var i = 0; i < dlength; i++) {
         var date = dates[i]
         var changesets = sprint[date];
         var cslength = changesets.length;
         for (var j = 0; j < cslength; j++) {
            var changeset = changesets[j];
            var ID = changeset["ChangeSetId"].toString();
            var User = changeset["OwnerDisplayName"];
            var Date = changeset["CheckinDate"];
            var Comment = changeset["Comment"];
            var WorkItems = changeset["WorkItems"];
            var ServerItems = changeset["ServerItems"];
            var silength = ServerItems.length;
            var pattern = new RegExp(value, "gi");
            var match = false;
            if (ID.search(pattern) != -1 || User.search(pattern) != -1 || Date.search(pattern) != -1 || Comment.search(pattern) != -1)
               match = true;
            else {
               for (var k = 0; k < WorkItems.length; k++)
                  if (WorkItems[k].toString().search(pattern) != -1)
                     match = true;
               for (var k = 0; k < silength; k++)
                  if (ServerItems[k].search(pattern) != -1)
                     match = true;
            }
            if (match) {
               var ID = createAnchorString("viewChangesetDetail", date + "/" + j, ID);
               if (Comment.length > 100)
                  Comment = Comment.slice(0, 99) + "...";
               table += createTableRow([ID, User, Date, Comment]);
               tablerows++;
            }
         }
      }
      table += "</table>";
      if (!tablerows)
         table += insSp(20) + changeColor("---NO RESULTS---</br>", "white");
      var d = document.createElement("DIV");
      d.id = "table" + results;
      getID(results).appendChild(d);
      setInner("table" + results, table);
      var b = performance.now();
      console.log("\"" + value + "\" - " + (b - a) + " ms");
   }
}
function expandDailyChangesets(path) {
   var dateID = getID(path);
   var sprint = path.split("/")[1];
   path = "changereport/" + path;
   if (csCache[sprint][path]) {
      var changesets = csCache[sprint][path];
      createChangesetTable(changesets, path, "table" + path, "left20", dateID);
   }
   else {
      getJSON(path, dateID, "viewChangesetDetail");
   }
   dateID.firstChild.href = "javascript:collapseDailyChangesets('" + path + "')";
   dateID.firstChild.innerHTML = insImg("collapse");
}
function getJSON(path, div, func, caching) {
   var ajax = new XMLHttpRequest();
   path = "changereport/" + path;
   ajax.onreadystatechange = function () {
      if (ajax.readyState == 4 && ajax.status == 200) {
         if (caching) {
            var sprint = path.split("/")[2];
            csCache[sprint][path] = JSON.parse(ajax.responseText);
            path = path.split("/").slice(1).toString().replace(/,/g, "/");
            getID(path).style.color = "#009bd5";
         }
         else {
            var changesets = JSON.parse(ajax.responseText);
            createChangesetTable(changesets, path, "table" + path, "left20", div)
            csCache[path] = changesets;
         }
      }
   };
   ajax.open("GET", path, true);
   ajax.send();
}
function viewChangesetDetail(path) {
   var pathsplit = path.split("/");
   var sprint = pathsplit[2];
   var filePath = pathsplit.slice(0, 4).toString().replace(/,/g, "/");
   var changeset = csCache[sprint][filePath][pathsplit[4]];
   var html = "Changeset " + changeset["ChangeSetId"] + "</br></br>";
   html += changeset["OwnerDisplayName"] + " - " + changeset["CheckinDate"] + "</br></br>";
   html += "Comment</br>" + insSp(5) + changeset["Comment"] + "</br></br>";
   var WorkItems = changeset["WorkItems"];
   if (WorkItems.length > 0) {
      html += "WorkItems</br>";
      for (var i = 0; i < WorkItems.length; i++) {
         var wiid = WorkItems[i];
         var link = "http://tfs:8080/tfs/DefaultCollection/ILE/_workitems#_a=edit&id=" + wiid;
         html += insSp(5) + "<a href='" + link + "'>" + wiid + "</a></br>";
      }
   }
   var ServerItems = changeset["ServerItems"]
   var length = ServerItems.length;
   html += "Changes (" + length + ")</br>"
   var start = 0;
   if (length > 50) {
      html += insSp(5)
      if (pathsplit[5]) {
         start = Number(pathsplit[5]);
         if (start != 0) {
            var prev = start - 50;
            pathsplit[5] = prev;
            var pathprev = pathsplit.toString().replace(/,/g, "/");
            html += createAnchorString("viewChangesetDetail", pathprev, "[ Prev ]", "colored");
         }
      }
      var end = start + 49;
      if (end > length)
         end = length;
      html += " | " + start + "-" + end + " | ";
      var next = start + 50;
      if (next < length) {
         pathsplit[5] = next;
         var pathnext = pathsplit.toString().replace(/,/g, "/");
         html += createAnchorString("viewChangesetDetail", pathnext, "[ Next ]", "colored");
      }
      else
         next = length;
      length = next;
      html += "</br>";
   }
   for (var i = start; i < length; i++) {
      html += insSp(5) + ServerItems[i] + "</br>";
   }
   setInner("changesetDetail", html);
   transition(changesetDetailIDs);
}
function back2sprints() {
   setInner("changesetDetail", "");
   transition(sprintIDs);
}
function collapseSprint(sprint) {
   console.log(sprint);
   getID(sprint).removeChild(getID("dates" + sprint));
   getID(sprint).firstChild.href = "javascript:expandSprint('" + sprint + "')";
   getID(sprint).firstChild.innerHTML = insImg("expand");
   getID(sprint).removeChild(getID("search" + sprint));
}
function collapseDailyChangesets(path) {
   var p = path.split("/").slice(1).toString().replace(/,/g, "/");
   var div = getID(p);
   div.removeChild(getID("table" + path));
   div.firstChild.href = "javascript:expandDailyChangesets('" + p + "')";
   div.firstChild.innerHTML = insImg("expand");
}
function createChangesetTable(changesets, path, id, cn, append) {
   var length = changesets.length;
   var table = "<table><tr><th>ChangeSet</th><th>User</th><th>Time</th><th>Comment</th></tr>";
   for (var i = 0; i < length; i++) {
      var ChangeSetId = createAnchorString("viewChangesetDetail", path + "/" + i, changesets[i]["ChangeSetId"]);
      var OwnerDisplayName = changesets[i]["OwnerDisplayName"];
      var CheckinDate = changesets[i]["CheckinDate"].split(" ").slice(1).toString().replace(/,/, " ");
      var Comment = changesets[i]["Comment"];
      if (Comment.length > 100)
         Comment = changesets[i]["Comment"].slice(0, 99) + "...";
      table += createTableRow([ChangeSetId, OwnerDisplayName, CheckinDate, Comment]);
   }
   table += "</table>";
   if (!length)
      table += insSp(12) + changeColor("---NO CHANGESETS---</br>", "white");
   var d = document.createElement("DIV");
   d.id = id;
   d.className = cn;
   append.appendChild(d);
   setInner(id, table);
}
function getID(id) {
   return document.getElementById(id);
}
function setInner(id, string) {
   getID(id).innerHTML = string;
}
function createAnchorElement(func, path, inner) {
   var a = document.createElement("A");
   a.href = "javascript:" + func + "('" + path + "')";
   a.text = inner;
   return a;
}
function createAnchorString(func, path, inner, cl) {
   return "<a class=\"" + cl + "\" href=\"javascript:" + func + "('" + path + "')\">" + inner + "</a>";
}
function createTableRow(data) {
   var html = "<tr>";
   for (var i = 0; i < data.length; i++)
      html += "<td>" + data[i] + "</td>";
   html += "</tr>";
   return html;
}
function changeColor(text, color) {
   return "<span style=\"color:" + color + "\">" + text + "</span>";
}
function fillexpandImg(img) {
   img.src = "changereport/expandfill.png"
}
function unfillexpandImg(img) {
   img.src = "changereport/expand.png"
}
function fillcollapseImg(img) {
   img.src = "changereport/collapsefill.png"
}
function unfillcollapseImg(img) {
   img.src = "changereport/collapse.png"
}
function insSp(count) {
   var spaces = ""
   for (var i = 0; i < count; i++)
      spaces += "&nbsp";
   return spaces;
}
function insImg(type) {
   return "<img onmouseover='fill" + type + "Img(this)' onmouseout='unfill" + type + "Img(this)' src='changereport/" + type + ".png'>";
}
function transition(nextIDs) {
   hideIDs(currentIDs);
   showIDs(nextIDs);
   currentIDs = nextIDs;
}
function hideIDs(ids) {
   for (var i in ids)
      getID(ids[i]).style.display = "none";
}
function showIDs(ids) {
   for (var i in ids)
      getID(ids[i]).style.display = "block";
}
