/*
Copyright (C) 2015 Olavi Haapala.
<harbourwht@gmail.com>
Twitter: @0lpeh
IRC: olpe
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of wht nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

.import QtQuick.LocalStorage 2.0 as LS
var db = LS.LocalStorage.openDatabaseSync("WHT", "1.0", "StorageDatabase", 100000);

function resetDatabase() {
    db.transaction(function(tx) {
        tx.executeSql('DROP TABLE hours')
        tx.executeSql('DROP TABLE timer')
        tx.executeSql('DROP TABLE breaks')
        tx.executeSql('DROP TABLE projects')
        tx.executeSql('DROP TABLE tasks')
        tx.executeSql('CREATE TABLE IF NOT EXISTS hours(uid LONGVARCHAR UNIQUE, date TEXT, startTime TEXT, endTime TEXT, duration REAL,project TEXT, description TEXT,breakDuration REAL DEFAULT 0, taskId TEXT);');
        tx.executeSql('CREATE TABLE IF NOT EXISTS timer(uid INTEGER UNIQUE,starttime TEXT, started INTEGER);');
        tx.executeSql('CREATE TABLE IF NOT EXISTS breaks(id INTEGER PRIMARY KEY,starttime TEXT, started INTEGER, duration REAL DEFAULT -1);');
        tx.executeSql('CREATE TABLE IF NOT EXISTS projects(id LONGVARCHAR UNIQUE, name TEXT, hourlyRate REAL DEFAULT 0, contractRate REAL DEFAULT 0, budget REAL DEFAULT 0, hourBudget REAL DEFAULT 0, labelColor TEXT);');
        tx.executeSql('CREATE TABLE IF NOT EXISTS tasks(id LONGVARCHAR UNIQUE, projectId REFERENCES projects(id), name TEXT);');
        tx.executeSql('PRAGMA user_version=3;');
        Log.info("Database was resetted");
    });
}

function getUniqueId() {
     var d = new Date();
     var uid = d.getFullYear() +
               d.getMonth() +
               d.getDate() +
               d.getTime();
     return uid;
};

// At the start of the application, we can initialize the tables we need if they haven't been created yet
function initialize() {
    db.transaction(function(tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS hours(uid LONGVARCHAR UNIQUE, date TEXT,startTime TEXT, endTime TEXT, duration REAL,project TEXT, description TEXT, breakDuration REAL DEFAULT 0, taskId TEXT);');
        tx.executeSql('CREATE TABLE IF NOT EXISTS timer(uid INTEGER UNIQUE, starttime TEXT, started INTEGER);');
        tx.executeSql('CREATE TABLE IF NOT EXISTS breaks(id INTEGER PRIMARY KEY, starttime TEXT, started INTEGER, duration REAL DEFAULT -1);');
        tx.executeSql('CREATE TABLE IF NOT EXISTS projects(id LONGVARCHAR UNIQUE, name TEXT, hourlyRate REAL DEFAULT 0, contractRate REAL DEFAULT 0, budget REAL DEFAULT 0, hourBudget REAL DEFAULT 0, labelColor TEXT);');
        tx.executeSql('CREATE TABLE IF NOT EXISTS tasks(id LONGVARCHAR UNIQUE, projectId REFERENCES projects(id), name TEXT);');
        tx.executeSql('PRAGMA user_version=3;');
    });

    Log.info("Database ready.")
}

function updateIfNeededToV2() {
    db.transaction(function(tx) {
        var rs = tx.executeSql('PRAGMA user_version');
        if (rs.rows.length > 0) {
            if (rs.rows.item(0).user_version < 2) {
                var ex = tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='hours';");
                //check if rows exist
                if (ex.rows.length > 0) {
                    if (ex.rows.item(0).name ==="hours") {
                        tx.executeSql('ALTER TABLE hours ADD breakDuration REAL DEFAULT 0;');
                        tx.executeSql('PRAGMA user_version = 2;');
                        Log.info("Updating table hours to user_version 2. Adding breakDuration column.");
                    }
                    else {
                        Log.error("No table named hours...");
                    }
                }
                else {
                    Log.error("No table named hours...");
                }
            }
        }
    });
}

function updateIfNeededToV3() {
    db.transaction(function(tx) {
        var rs = tx.executeSql('PRAGMA user_version');
        if (rs.rows.length > 0) {
            if (rs.rows.item(0).user_version < 3) {
                //console.log(rs.rows.item(0).user_version)
                var res = tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='hours';");
                //check if rows exist
                if (res.rows.length > 0) {
                    if (res.rows.item(0).name ==="hours") {
                        tx.executeSql('ALTER TABLE hours ADD taskId TEXT;');
                        tx.executeSql('PRAGMA user_version = 3;');
                        Log.info("Updating table hours to user_version 3. Adding taskId column.");
                    }
                    else {
                        Log.error("No table named hours...");
                    }
                }
                else {
                    Log.error("No table named hours...");
                }
            }
        }
    });
}

// This function is used to write hours into the database
// The function returns “OK” if it was successful, or “Error” if it wasn't
function setHours(uid,date,startTime, endTime, duration, project, description, breakDuration, taskId) {
    var res = "";
    db.transaction(function(tx) {
        var rs = tx.executeSql('INSERT OR REPLACE INTO hours VALUES (?,?,?,?,?,?,?,?,?);', [uid,date,startTime,endTime,duration,project,description, breakDuration, taskId]);
        if (rs.rowsAffected > 0) {
            res = "OK";
            Log.info("Hours saved to database");
        }
        else {
            res = "Error";
            Log.error("Error saving hours to database");
        }
    });

    return res;
}

// This function is used to retrieve hours for a day from the database
function getHoursDay(offset, projectId) {
    var dur = 0;
    var rs;

    db.transaction(function(tx) {
        if (projectId) {
            rs = tx.executeSql('SELECT DISTINCT uid, duration, breakDuration FROM hours WHERE date = strftime("%Y-%m-%d", "now", "-' + offset + ' days", "localtime") AND project=?;', [projectId]);
        }
        else {
            rs = tx.executeSql('SELECT DISTINCT uid, duration, breakDuration FROM hours WHERE date = strftime("%Y-%m-%d", "now", "-' + offset + ' days", "localtime");');
        }

        for (var i = 0; i < rs.rows.length; i++) {
            dur+= rs.rows.item(i).duration;
            dur-= rs.rows.item(i).breakDuration;
        }
    });

    return dur;
}

// This function is used to retrieve hours for a week from the database
function getHoursWeek(offset, projectId) {
    var dur = 0;
    var rs;

    db.transaction(function(tx) {
        if (offset === 0) {
            if (projectId) {
                rs = tx.executeSql('SELECT DISTINCT uid, duration, breakDuration FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now","localtime" , "weekday 0", "-6 days") AND strftime("%Y-%m-%d", "now", "localtime", "weekday 0") AND  project=?;', [projectId]);
            }
            else {
                rs = tx.executeSql('SELECT DISTINCT uid, duration, breakDuration FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now","localtime" , "weekday 0", "-6 days") AND strftime("%Y-%m-%d", "now", "localtime", "weekday 0");');

            }
        }
        else if (projectId) {
            rs = tx.executeSql('SELECT DISTINCT uid, duration, breakDuration FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now","localtime" , "weekday 0", "-13 days") AND strftime("%Y-%m-%d", "now", "localtime", "weekday 0", "-7 days") AND  project=?;', [projectId]);
        }
        else {
            rs = tx.executeSql('SELECT DISTINCT uid, duration, breakDuration FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now","localtime" , "weekday 0", "-13 days") AND strftime("%Y-%m-%d", "now", "localtime", "weekday 0", "-7 days");');
        }

        for (var i = 0; i < rs.rows.length; i++) {
            dur+= rs.rows.item(i).duration;
            dur-= rs.rows.item(i).breakDuration;
        }
    });

    return dur;
}

// This function is used to retrieve hours for a month from the database
function getHoursMonth(offset, projectId) {
    var dur = 0;
    var rs;
    db.transaction(function(tx) {
        if (offset === 0) {
             if (projectId) {
                 rs = tx.executeSql('SELECT DISTINCT uid, duration, breakDuration FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now", "localtime", "start of month") AND strftime("%Y-%m-%d","now","localtime") AND  project=?;', [projectId]);
             }
             else {
                rs = tx.executeSql('SELECT DISTINCT uid, duration, breakDuration FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now", "localtime", "start of month") AND strftime("%Y-%m-%d","now","localtime");');

             }
        }
        else {
             if (projectId) {
                 rs = tx.executeSql('SELECT DISTINCT uid, duration, breakDuration FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now", "localtime", "start of month", "-1 month") AND strftime("%Y-%m-%d", "now", "localtime", "start of month", "-1 day") AND  project=?;', [projectId]);
             }
             else {
                 rs = tx.executeSql('SELECT DISTINCT uid, duration, breakDuration FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now", "localtime", "start of month", "-1 month") AND strftime("%Y-%m-%d", "now", "localtime", "start of month", "-1 day");');
             }
        }

        for (var i = 0; i < rs.rows.length; i++) {
            dur+= rs.rows.item(i).duration;
            dur-= rs.rows.item(i).breakDuration;
        }
    });

    return dur;
}

// This function is used to retrieve hours for a year from the database
function getHoursYear(offset, projectId) {
    var dur = 0;
    var rs;
    db.transaction(function(tx) {
        if (offset === 0) {
            if (projectId) {
                rs = tx.executeSql('SELECT DISTINCT uid, duration, breakDuration FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now","localtime" , "start of year") AND strftime("%Y-%m-%d", "now", "localtime") AND  project=?;', [projectId]);
            }
            else {
                rs = tx.executeSql('SELECT DISTINCT uid, duration, breakDuration FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now","localtime" , "start of year") AND strftime("%Y-%m-%d", "now", "localtime");');
            }
        }
        else {
            if (projectId) {
                rs = tx.executeSql('SELECT DISTINCT uid, duration, breakDuration FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now","localtime" , "start of year" , "-1 years") AND strftime("%Y-%m-%d", "now","localtime" , "start of year" ,"-1 day") AND  project=?;', [projectId]);
            }
            else {
                rs = tx.executeSql('SELECT DISTINCT uid, duration, breakDuration FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now","localtime" , "start of year" , "-1 years") AND strftime("%Y-%m-%d", "now","localtime" , "start of year" ,"-1 day");');
            }
        }

        for (var i = 0; i < rs.rows.length; i++) {
            dur+= rs.rows.item(i).duration;
            dur-= rs.rows.item(i).breakDuration;
        }
    });

    return dur;
}

// This function is used to retrieve all hours from the database
function getHoursAll(projectId) {
    var dur = 0;
    var rs;
    db.transaction(function(tx) {
        if (projectId) {
            rs = tx.executeSql('SELECT * FROM hours WHERE  project=?;', [projectId]);
        }
        else {
            rs = tx.executeSql('SELECT * FROM hours;');
        }

        for (var i = 0; i < rs.rows.length; i++) {
            dur+= rs.rows.item(i).duration;
            dur-= rs.rows.item(i).breakDuration;
        }
    });

    return dur;
}


// This function is used to get all data from the database
function getAll(sortby, projectId) {
    var allHours = [];
    var rs;

    db.transaction(function(tx) {
        if (projectId) {
            if (sortby === "project") {
                rs = tx.executeSql('SELECT * FROM hours WHERE project=? ORDER BY project DESC, date DESC, startTime DESC;', [projectId]);
            }
            else {
                rs = tx.executeSql('SELECT * FROM hours WHERE project=? ORDER BY date DESC, startTime DESC;', [projectId]);
            }
        }

        else {
            if (sortby === "project") {
                rs = tx.executeSql('SELECT * FROM hours ORDER BY project DESC, date DESC, startTime DESC;');
            }
            else {
                rs = tx.executeSql('SELECT * FROM hours ORDER BY date DESC, startTime DESC;');
            }
        }

        for (var i = 0; i < rs.rows.length; i++) {
            var item = {};
            item["uid"]=rs.rows.item(i).uid;
            item["date"]= rs.rows.item(i).date;
            item["startTime"]=rs.rows.item(i).startTime;
            item["endTime"]=rs.rows.item(i).endTime;
            item["duration"]=rs.rows.item(i).duration;
            item["project"]=rs.rows.item(i).project;
            item["description"]=rs.rows.item(i).description;
            item["breakDuration"]= rs.rows.item(i).breakDuration;

            if (rs.rows.item(i).taskId) {
                item["taskId"] = rs.rows.item(i).taskId;
            }
            else {
                item["taskId"] = "0";
            }

            allHours.push(item);
        }
    });

    return allHours;
}

// This function is used to retrieve data for a day from the database
function getAllDay(offset, sortby, projectId) {
    var allHours = [];
    var rs;

    db.transaction(function(tx) {
        var orderby = "ORDER BY date DESC, startTime DESC";

        if (sortby === "project") {
            orderby = "ORDER BY project DESC, date DESC, startTime DESC";
        }

        if (projectId) {
            if (offset === 0) {
                rs = tx.executeSql('SELECT * FROM hours WHERE date = strftime("%Y-%m-%d", "now", "localtime") AND project=? ' + orderby + ';', [projectId]);
            }
            else {
                rs = tx.executeSql('SELECT * FROM hours WHERE date = strftime("%Y-%m-%d", "now", "localtime", "-1 day") AND project=? ' + orderby + ';', [projectId]);
            }
        }
        else {
            if (offset === 0) {
                rs = tx.executeSql('SELECT * FROM hours WHERE date = strftime("%Y-%m-%d", "now", "localtime") ' + orderby + ';');
            }
            else {
                rs = tx.executeSql('SELECT * FROM hours WHERE date = strftime("%Y-%m-%d", "now", "localtime", "-1 day") ' + orderby + ';');
            }
        }

        for (var i = 0; i < rs.rows.length; i++) {
            var item = {};
            item["date"]= rs.rows.item(i).date;
            item["uid"]=rs.rows.item(i).uid;
            item["startTime"]=rs.rows.item(i).startTime;
            item["endTime"]=rs.rows.item(i).endTime;
            item["duration"]=rs.rows.item(i).duration;
            item["project"]=rs.rows.item(i).project;
            item["description"]=rs.rows.item(i).description;
            item["breakDuration"]= rs.rows.item(i).breakDuration;

            if (rs.rows.item(i).taskId) {
               item["taskId"] = rs.rows.item(i).taskId;
            }
            else {
               item["taskId"] = "0";
            }

            allHours.push(item);
        }
    });

    return allHours;
}

// This function is used to retrieve data this week from the database
function getAllWeek(offset, sortby, projectId) {
    var allHours = [];
    var rs;
    db.transaction(function(tx) {
        var orderby = "ORDER BY date DESC, startTime DESC";

        if (sortby === "project") {
            orderby = "ORDER BY project DESC, date DESC, startTime DESC";
        }

        if (projectId) {
            if (offset === 0) {
                rs = tx.executeSql('SELECT * FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now","localtime" , "weekday 0", "-6 days") AND strftime("%Y-%m-%d", "now", "localtime", "weekday 0") AND project=? ' + orderby + ';', [projectId]);
            }
            else {
                rs = tx.executeSql('SELECT * FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now","localtime", "weekday 0", "-13 days") AND strftime("%Y-%m-%d", "now", "localtime", "weekday 0", "-7 days") AND project=? ' + orderby + ';', [projectId]);
            }
        }
        else {
            if (offset === 0) {
                rs = tx.executeSql('SELECT * FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now","localtime" , "weekday 0", "-6 days") AND strftime("%Y-%m-%d", "now", "localtime", "weekday 0") ' + orderby + ';');
            }
            else {
                rs = tx.executeSql('SELECT * FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now","localtime", "weekday 0", "-13 days") AND strftime("%Y-%m-%d", "now", "localtime", "weekday 0", "-7 days") ' + orderby + ';');
            }
        }

        for (var i = 0; i < rs.rows.length; i++) {
            var item = {};
            item["uid"]=rs.rows.item(i).uid;
            item["date"]= rs.rows.item(i).date;
            item["startTime"]=rs.rows.item(i).startTime;
            item["endTime"]=rs.rows.item(i).endTime;
            item["duration"]=rs.rows.item(i).duration;
            item["project"]=rs.rows.item(i).project;
            item["description"]=rs.rows.item(i).description;
            item["breakDuration"]= rs.rows.item(i).breakDuration;

            if (rs.rows.item(i).taskId) {
               item["taskId"] = rs.rows.item(i).taskId;
            }
            else {
               item["taskId"] = "0";
            }

            allHours.push(item);
        }
    });

    return allHours;
}

// This function is used to retrieve data this month from the database
function getAllMonth(offset, sortby, projectId) {
    var allHours = [];
    var orderby = "ORDER BY date DESC, startTime DESC";

    if (sortby === "project") {
        orderby = "ORDER BY project DESC, date DESC, startTime DESC";
    }

    var rs;
    db.transaction(function(tx) {
        if (projectId) {
            if (offset === 0) {
                rs = tx.executeSql('SELECT * FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now", "localtime", "start of month") AND strftime("%Y-%m-%d", "now", "localtime") AND project=? ' + orderby + ';', [projectId]);
            }
            else {
                rs = tx.executeSql('SELECT * FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now", "localtime", "start of month", "-1 month") AND strftime("%Y-%m-%d", "now", "localtime", "start of month", "-1 day") AND project=? ' + orderby + ';', [projectId]);
            }
        }
        else {
            if (offset === 0) {
                rs = tx.executeSql('SELECT * FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now", "localtime", "start of month") AND strftime("%Y-%m-%d", "now", "localtime") ' + orderby + ';');
            }
            else {
                rs = tx.executeSql('SELECT * FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now", "localtime", "start of month", "-1 month") AND strftime("%Y-%m-%d", "now", "localtime", "start of month", "-1 day") ' + orderby + ';');
            }
        }

        for (var i = 0; i < rs.rows.length; i++) {
            var item = {};
            item["uid"]=rs.rows.item(i).uid;
            item["date"]= rs.rows.item(i).date;
            item["startTime"]=rs.rows.item(i).startTime;
            item["endTime"]=rs.rows.item(i).endTime;
            item["duration"]=rs.rows.item(i).duration;
            item["project"]=rs.rows.item(i).project;
            item["description"]=rs.rows.item(i).description;
            item["breakDuration"]= rs.rows.item(i).breakDuration;

            if (rs.rows.item(i).taskId) {
               item["taskId"] = rs.rows.item(i).taskId;
            }
            else {
               item["taskId"] = "0";
            }

            allHours.push(item);
        }
    });

    return allHours;
}

// This function is used to retrieve data this year from the database
function getAllThisYear(sortby, projectId) {
    var orderby = "ORDER BY date DESC, startTime DESC";

    if (sortby === "project") {
        orderby = "ORDER BY project DESC, date DESC, startTime DESC";
    }

    var allHours = [];
    var rs;
    db.transaction(function(tx) {
        if (projectId) {
            rs = tx.executeSql('SELECT * FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now","localtime" , "start of year") AND strftime("%Y-%m-%d", "now", "localtime") AND project=? ' + orderby + ';', [projectId]);
        }
        else {
            rs = tx.executeSql('SELECT * FROM hours WHERE date BETWEEN strftime("%Y-%m-%d", "now","localtime" , "start of year") AND strftime("%Y-%m-%d", "now", "localtime") ' + orderby + ';');
        }

        for (var i = 0; i < rs.rows.length; i++) {
            var item = {};
            item["uid"]=rs.rows.item(i).uid;
            item["date"]= rs.rows.item(i).date;
            item["startTime"]=rs.rows.item(i).startTime;
            item["endTime"]=rs.rows.item(i).endTime;
            item["duration"]=rs.rows.item(i).duration;
            item["project"]=rs.rows.item(i).project;
            item["description"]=rs.rows.item(i).description;
            item["breakDuration"]= rs.rows.item(i).breakDuration;
            if (rs.rows.item(i).taskId) {
                item["taskId"] = rs.rows.item(i).taskId;
            }
            else {
                item["taskId"] = "0";
            }
            allHours.push(item);
        }
    });

    return allHours;
}

/* This function is used to remove items from the
  hours table */
function remove(uid) {
    Log.info("Removing: " + uid);
    db.transaction(function(tx) {
        var rs = tx.executeSql('DELETE FROM hours WHERE uid=?;' , [uid]);

        if (rs.rowsAffected > 0) {
            Log.info("Deleted!");
        }
        else {
            Log.error("Error deleting. No deletion occured.");
        }
    });
}

/* Get timer starttime
returns the starttime or "Not started" */
function getStartTime() {
    var started = 0;
    var resp = "";

    db.transaction(function(tx) {
        var rs = tx.executeSql('SELECT * FROM timer');
        if (rs.rows.length > 0) {
            started = rs.rows.item(0).started;

            if (started) {
                resp = rs.ows.item(0).starttime;
            }
            else {
                resp = "Not started";
            }
        }
        else {
            resp = "Not started";
        }
    });

    return resp;
}

/* Start the timer
Simply sets the starttime and started to 1
Returns the starttime if inserting is successful */
function startTimer(newValue) {
    var resp = "";
    var datenow = new Date();
    var startTime = newValue || datenow.getHours().toString() + ":" + datenow.getMinutes().toString();

    db.transaction(function(tx) {
        var rs = tx.executeSql('INSERT OR REPLACE INTO timer VALUES (?,?,?)', [1, startTime, 1]);

        if (rs.rowsAffected > 0) {
            resp = startTime;
            Log.info("Timer was saved to database at: " + startTime);
        }
        else {
            resp = "Error";
            Log.error("Error saving the timer");
        }
    });

    return resp;
}

/* Stop the timer
 Stops the timer, sets started to 0
 and saves the endTime
 NOTE: the endtime is not used anywhere atm. */
function stopTimer() {
    var datenow = new Date();
    var endTime = datenow.getHours().toString() + ":" + datenow.getMinutes().toString();

    db.transaction(function(tx) {
        var rs = tx.executeSql('REPLACE INTO timer VALUES (?,?,?);', [1, endTime, 0]);

        if (rs.rowsAffected > 0) {
            Log.info("Timer was stopped at: "+ endTime);
        }
        else {
            Log.error("Error stopping the timer");
        }
    });
}



/* BREAK TIMER FUNCTIONS
These functions are used when the timer
is running and the user pauses it */

/* Get break timer starttime
returns the starttime or "Not started" */
function getBreakStartTime() {
    var started = 0;
    var resp = "";
    db.transaction(function(tx) {
        var rs = tx.executeSql('SELECT * FROM breaks ORDER BY id DESC LIMIT 1;');
        if (rs.rows.length > 0) {
            started = rs.rows.item(0).started;
            if (started) {
                resp = rs.rows.item(0).starttime;
            }
            else {
                resp = "Not started";
            }
        }
        else {
            resp = "Not started";
        }
    });

    return resp;
}

/* Start the break timer
Simply sets the break starttime and started to 1
Returns the starttime if inserting is successful.
Also used for adjusting the starttime */
function startBreakTimer() {
    var resp = "";
    var datenow = new Date();
    var startTime = datenow.getHours().toString() +":" + datenow.getMinutes().toString();

    db.transaction(function(tx) {
        var rs = tx.executeSql('INSERT INTO breaks VALUES (NULL,?,?,?)', [startTime, 1, -1]);
        if (rs.rowsAffected > 0) {
            resp = startTime;
            Log.info("Break Timer was started at: " + startTime);
        }
        else {
            resp = "Error";
            Log.error("Error starting the break timer");
        }
    });

    return resp;
}

/* Stop the break timer
Gets the id of the last added row which
should be the current breaktimer row and
saves the duration in to that row. */
function stopBreakTimer(duration) {
    var id = 0;
    db.transaction(function(tx) {
        var rs = tx.executeSql('SELECT * FROM breaks ORDER BY id DESC LIMIT 1;');
        if (rs.rows.length > 0) {
            id = rs.rows.item(0).id;
        }
    });
    if (id) {
        db.transaction(function(tx) {
            var rs = tx.executeSql('REPLACE INTO breaks VALUES (?,?,?,?);', [id, startTime, 0, duration]);

            if (rs.rowsAffected > 0) {
                Log.info("BreakTimer was stopped, duration was: " + duration);
            }
            else {
                resp = "Error";
                Log.error("Error stopping the breaktimer");
            }
        });
    }
    else {
        Log.error("Error getting last row id");
    }
}

/* Get the break durations from the database
Gets all break rows. Users may use the breaktimer
several times during a work day. */
function getBreakTimerDuration() {
    var dur = 0.0;
    db.transaction(function(tx) {
        var rs = tx.executeSql('SELECT * FROM breaks');
        if (rs.rows.length > 0) {
            for(var i = 0; i<rs.rows.length; i++) {
                if (rs.rows.item(i).duration !==-1)
                    dur += rs.rows.item(i).duration;
            }
        }
    });

    return dur;
}

/* Clear out the breaktimer
Only the duration of the breaks
are added to the hours table.
Breaks table can be cleared everytime */
function clearBreakTimer() {
    db.transaction(function(tx) {
        tx.executeSql('DELETE FROM breaks');
    });
}

/* PROJECT FUNCTIONS
These functions are for projects */

function setProject(id, name, hourlyRate, contractRate, budget, hourBudget, labelColor) {
    var resp = "";
    db.transaction(function(tx) {
        var rs = tx.executeSql('INSERT OR REPLACE INTO projects VALUES (?,?,?,?,?,?,?);', [id, name, hourlyRate, contractRate, budget, hourBudget, labelColor]);
        if (rs.rowsAffected > 0) {
            resp = "OK";
            Log.info("Project saved to database");
        } else {
            resp = "Error";
            Log.error("Error saving project to database");
        }
    });

    return resp;
}

function getProjects() {
    var resp = [];
    db.transaction(function(tx) {
        var rs = tx.executeSql('SELECT * FROM projects ORDER BY id DESC');
        if (rs.rows.length > 0) {
            for (var i = 0; i<rs.rows.length; i++) {
                var projectId = rs.rows.item(i).id
                var projectTasks = getProjectTasks(projectId)
                var item = {};
                item["id"]=projectId;
                item["name"]= rs.rows.item(i).name;
                item["hourlyRate"]=rs.rows.item(i).hourlyRate;
                item["contractRate"]=rs.rows.item(i).contractRate;
                item["budget"]=rs.rows.item(i).budget;
                item["hourBudget"]=rs.rows.item(i).hourBudget;
                item["labelColor"]=rs.rows.item(i).labelColor;
                item["breakDuration"]= rs.rows.item(i).breakDuration;
                item["tasks"]=projectTasks;
                resp.push(item);
            }
        }
    });

    return resp;
}

function getProjectById(id) {
    var item = {};
    db.transaction(function(tx) {
        var rs = tx.executeSql('SELECT * FROM projects WHERE id=?;', [id]);
        if (rs.rows.length > 0) {
            for (var i = 0; i<rs.rows.length; i++) {
                item["id"]=rs.rows.item(i).id;
                item["name"]= rs.rows.item(i).name;
                item["hourlyRate"]=rs.rows.item(i).hourlyRate;
                item["contractRate"]=rs.rows.item(i).contractRate;
                item["budget"]=rs.rows.item(i).budget;
                item["hourBudget"]=rs.rows.item(i).hourBudget;
                item["labelColor"]=rs.rows.item(i).labelColor;
                item["breakDuration"]= rs.rows.item(i).breakDuration;
                break;
            }
        }
    });

    return item;
}

function removeProject(id) {
    db.transaction(function(tx) {
        var rs = tx.executeSql('DELETE FROM projects WHERE id=?;' , [id]);
        if (rs.rowsAffected > 0) {
            Log.info("Project deleted from database!");
        }
        else {
            Log.info("Error deleting project. No deletion occured.");
        }
    });
}

function removeProjects() {
    db.transaction(function(tx) {
        tx.executeSql('DELETE FROM projects');
    });
}

function moveAllHoursToProject(id) {
    var resp = "Error updating existing hours!";
    var sqlstr = "UPDATE hours SET project='"+id+"';";
    db.transaction(function(tx) {
        var rs = tx.executeSql(sqlstr);
        if (rs.rowsAffected > 0) {
            resp = "Updated hours to project id: " + id;
        }
    });

    return resp;
}

function moveAllHoursToProjectByDesc(defaultProjectId) {
    var resp = "OK";
    var projects = getProjects();
    var allhours = getAll();
    for (var i = 0; i < allhours.length; i++) {
        var sqlstr = "UPDATE hours SET project='"+ defaultProjectId +"' WHERE uid='"+ allhours[i].uid +"';";
        if (allhours[i].description !== "No description") {
            for (var k = 0; k < projects.length; k++) {
                if ((allhours[i].description.toLowerCase()).indexOf(projects[k].name.toLowerCase()) > -1) {
                    sqlstr = "UPDATE hours SET project='"+ projects[k].id +"' WHERE uid='"+ allhours[i].uid +"';";
                }
            }
        }

        db.transaction(function(tx) {
            var rs = tx.executeSql(sqlstr);
        });
    }

    return "Updated: " + i + " rows";
}



// Tasks

// Save task
function setTask(taskId, projectId, name) {
    var resp = "";
    db.transaction(function(tx) {
        var rs = tx.executeSql('INSERT OR REPLACE INTO tasks VALUES (?,?,?);', [taskId, projectId, name]);
        if (rs.rowsAffected > 0) {
            resp = "OK";
            Log.info("Task saved to database");
        }
        else {
            resp = "Error";
            Log.error("Error saving task to database");
        }
    });

    return resp;
}

function getProjectTasks(projectId) {
    var resp = [];
    db.transaction(function(tx) {
        var rs = tx.executeSql('SELECT * FROM tasks WHERE projectId=? ORDER BY id ASC;', [projectId]);

        if (rs.rows.length > 0) {
            for (var i = 0; i<rs.rows.length; i++) {
                var item = {};
                item["id"]=rs.rows.item(i).id;
                item["name"]= rs.rows.item(i).name;
                resp.push(item);
            }
        }
    });

    return resp;
}

function getTaskById(id) {
    var item = {};
    db.transaction(function(tx) {
        var rs = tx.executeSql('SELECT * FROM tasks WHERE id=?;', [id]);
        if (rs.rows.length > 0) {
            for (var i = 0; i<rs.rows.length; i++) {
                item["id"]=rs.rows.item(i).id;
                item["name"]= rs.rows.item(i).name;
                break;
            }
        }
    });
    return item;
}

function removeTask(id) {
    db.transaction(function(tx) {
        var rs = tx.executeSql('DELETE FROM tasks WHERE id=?;' , [id]);
        if (rs.rowsAffected > 0) {
            Log.info("Task was deleted from database!");
        }
        else {
            Log.info("Error deleting task. No deletion occured.");
        }
    });
}

/* Fetch last used input */
function getLastUsed(projectId, taskId) {
    var rs;
    var result = {
        projectId: "",
        taskId: "",
        description: "",
    }

    db.transaction(function(tx) {
        if (projectId && taskId) {
            rs = tx.executeSql('SELECT project, taskId, description FROM hours WHERE project=? AND taskId=? ORDER BY strftime("%Y-%m-%d", date) DESC LIMIT 1;', [projectId, taskId]);
        }
        else if (projectId && !taskId) {
            rs = tx.executeSql('SELECT project, taskId, description FROM hours WHERE project=? ORDER BY strftime("%Y-%m-%d", date) DESC LIMIT 1;', [projectId]);
        }
        else {
            rs = tx.executeSql('SELECT project, taskId, description FROM hours ORDER BY strftime("%Y-%m-%d", date) DESC LIMIT 1;');
        }

        if (rs.rows.length > 0) {
            if (rs.rows.item(0).project) {
                result['projectId'] = rs.rows.item(0).project;
            }

            if (rs.rows.item(0).taskId) {
                result['taskId'] = rs.rows.item(0).taskId;
            }

            if (rs.rows.item(0).description && rs.rows.item(0).description != 'No description') {
                result['description'] = rs.rows.item(0).description;
            }
        }
    });

    return result;
}
