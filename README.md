# Working Hours Tracker

An easy to use and simple Working Hours Tracker for SailfishOS

- v. 1.2.3-1 (for phone and tablet) available in Jolla store (06.11.2017)<br />
- v. 1.2.3-2 available in [openrepos](https://openrepos.net/content/olpe/working-hours-tracker)
- Newest version also available with direct download [here](https://github.com/olpeh/wht/tree/master/RPMS)

## Quick links

[Changelog](https://github.com/olpeh/wht/blob/master/qml/CHANGELOG.md)<br />
[Current features](#current-features)<br />
[License](https://github.com/olpeh/wht/blob/master/LICENSE.md)<br />
[Roadmap](#roadmap)<br />
[How to use](#how-to-use)<br />
[Exporting](#exporting)<br />
[Importing](#importing)

## Donate
Donations are welcome :)<br />

[![Flattr this git repo](http://api.flattr.com/button/flattr-badge-large.png)](https://flattr.com/submit/auto?user_id=olpe&url=https%3A%2F%2Fgithub.com%2Folpeh%2Fwht&tags=github&category=software)

Paypal [EUR](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=9HY294XX4EJFW&lc=FI&item_name=Olpe&item_number=Working%20Hours%20Tracker&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted)<br />
Paypal [USD](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=9HY294XX4EJFW&lc=FI&item_name=Olpe&item_number=Working%20Hours%20Tracker&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted)

## Translate

Working Hours Tracker project is in transifex. Please contribute to translations there:

https://www.transifex.com/projects/p/working-hours-tracker/

## Current features:
* Adding hours
* Timer - saves starting time to database
* Viewing hours in different categories
* Deleting
* Editing
* Resetting database in settings
* Cover actions for timer and adding new hours
* Cover info for today, week and month
* Changing effort times by adjusting duration
* Adding break possibility
* Settings for default duration and default break
* Setting for timer autostart on app startup
* Break functionality in timer
* Possibility to adjust timer start time
* Support for different projects
* Project coloring
* Shows price for efforts if project hourlyrate is set
* Project view
* Category summary
* Email reports
* Exporting as csv
* Exporting as .sql dump
* Importing database dump
* Translations
* Logging
* Setting for default break in timer
* Tasks within projects
* Autofill last used input
* Rounding to nearest

## Roadmap:
* Importing .csv
* Requested features
* Graphs?

## License

[See license here](https://github.com/olpeh/wht/blob/master/LICENSE.md)


## How to use

### Adding hours

Working Hours Tracker is quite easy to use. Adding hours can be done in two different ways.

1. You can access the add hours in the pulley menu on the first page. It takes you to the add page.
2. Start the timer when starting to work. You can then close the app if you want to and the timer will stay running. At the end of your work day, stop the timer and it should take you to the add page where you can adjust the details, add description and select the project.

### Adding projects

Projects can be added and edited in the settings. You can select the labelcolor and hourlyrate for a project. You can edit projects by clicking them. When editing a project you can select if you want to make that project the
default project which will be automatically selected when adding hours. If you set the hourlyrate for a project, you will see the price for spent hours in the detailed listing and summaries.

### Using the timer

Timer can be used by pressing the big button on the first page. When started, you will see three buttons for controlling the timer.

On the left you have a break button which is meant to be used if you have a break
during your workday that you don't want to include in the duration. Break works just like the timer: you start it by clicking it and stop it when the break is over.

The button in the middle stops the timer and takes you to the add page where you will be able to adjust the start and endtime and other details for the effort. The hours will be saved only when accepting the dialog.

On the right side you have a button for adjusting the timer start time. It can be used if you forget to start the timer when you start to work.

### Using the cover

Cover actions can be used to quickly add hours or to control the timer. Cover actions include adding hours, starting the timer, starting a break, ending a break and stopping the timer.

When stopping the timer from the cover, it should open up the appwindow in the add view and after closing the dialog it should get minimized back to cover.

### Summaries

On the first page you will see total hours for different categories. If you have more than one projects you should see a attached page that can be accessed by swiping left from the first page. There you can see hours for one project at a time

Clicking a category will take you to the detailed listing view where you can see all entries in that category. You can edit those entries by clicking them.

By swiping left in the detailed view you can see a detailed summary for that category.

### Settings

There are a few settings in the settings page that makes adding hours faster and easier. Default duration and default break duration will be used when manually adding hours. Starts now or Ends now by default means the option to select if you want the start time or the endtime be set to the time now when adding hours manually.

Other settings are explained in the settings page and more will come in the future versions.


### Exporting

In the settings you find different methods for exporting data from Working Hours Tracker.

When selecting to export Hours as CSV the syntax will look like this: <br />
<strong>'uid','date','startTime','endTime',duration,'project','description',breakDuration</strong><br />

Where entries surrounded by ' are strings (LONGVARCHAR or TEXT in the sqlite database) And durations are of type REAL with . as decimal separator. An example line would look like this:

'2015231425401087574','2015-04-20','12:38','18:44',6.1,'20153191429477190454','Code review',0

This is also the syntax which is expected for the .csv importing (Coming later...) Exporting as .csv from Working Hours Tracker will create the data in the right format but if you e.g want to import your existing data into Working Hours Tracker you can create .csv files in the above syntax. <br />
<strong>Please note that uid must be an unique id of type LONGVARCHAR and project should be an id of an existing project in your database.</strong><br />

Project in hours means a project id. <br /><br />
When exporting projects as CSV the syntax will look like this:<br />
<strong>'id','name',hourlyRate,contractRate,budget,hourBudget,'labelColor'</strong><br />

An example project line would look like this:<br />
'20153191429477190454','Project name',0,0,0,0,'#ccb865'

Exporting the whole database creates a sqlite dump of the database.<br />

### Importing

At the moment importing is only possible from a .sql file. The .csv file support will come later.<br />
Don't worry for duplicates when importing because the entries have unique id's and duplicates cannot exist in the database due to unique constraints.<br />

<strong>Please note that importing uses INSERT OR REPLACE so you can update edited entries.</strong>

### Startup commands
Still WIP (but it works)

#### Commands atm:
- `harbour-workinghourstracker --start`
- `harbour-workinghourstracker --stop`






