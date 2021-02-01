The files in this folder allow you to visualize 2D scatterplots **as long as they respect a certain format**.
This file gives you the necessary instructions to reuse this somewhere else.
Last update (of this file): August 27th, 2019

One note: when I use square brackets, it means you fill in information inside, but you shouldn't write the brackets.

1. WHAT FILES DO I NEED?
To effectively use this visualization tool, you need:
- the level1.html, level2.html, level3.html files
- custom.css (CSS file)
- favicon.ico (for the logo in the title)
- d3-legend.min.js (d3 file for legends; the rest of the sources are obtained online... so you do need internet!)
For each of the types you want to visualize,
- a directory with the name [type], containing the following files:
    - a file with the name [type].models.tsv (described below, item 3)
    - a file with the name [type].tsv (described below, item 4)
    - files with a name format to be defined (now it's 'ppmi.[type].[window].[corpus].tsv') with the ppmi values of the context words.
    - a file with the name [type].models.dist.tsv if you want a distance matrix in level 2 (see item 7).
    I still have to figure out a straightforward way of matching a given model to the right weighting system.
Finally (or for starters) you need an index file with the links to access the clouds (see item 5).
It doesn't need to be the one I designed, but if you use it, adapt the background picture
(or show the church and keep 'copenhagechurch.jpg').

2. DO I NEED TO USE A GITHUB PAGE?
The github page is an easy way of sharing your clouds (and this code):
you need a repository called [username].github.io in the 'username' account with at least one file called 'index.html'.
That file could be the file with links to access the clouds (see item 5) or any other portal that eventually takes you
to that 'index'.
But what you need is a web server, doesn't need to be github. I use apache to test the code before gitting it, for instance.

3. WHAT SHOULD [TYPE].MODELS.TSV LOOK LIKE?
"[type].models.tsv" should be a tab-separated-file with:
- a column called '_model', where each row is the name of a model
- a column called 'model.x' and one called 'model.y', with the x and y coordinates of your cloud of models
    - on this repository, check semevalProcrustes.R for the code to generate it based on the list of models and the [type].tsv file
- columns with parameters to filter and color-, shape- or sizecode the scatterplot
    NOTE: I've recently managed to automatize the generation of filtering buttons;
    for now, the code assumes that parameters for the FOCC and SOCC level have 'focc_' and 'socc_' prefixes and those for the final level, none;
    the filter for the 'resulting token level matrix', in this case, was added ad hoc.

4. WHAT SHOULD [TYPE].TSV LOOK LIKE?
"[type].tsv" should be a tab-separated-file with:
- a column called '_id', where each row is the id of a token
- twice as many columns as models you have, with the format [model].x and [model].y,
    where 'model' matches a name in the '_model' column of '[type].models.tsv',
    and where the values are the x and y coordinates of the tokens in said model.
    Missing tokens (present in only some models) should have coordinates 0.0 (and will be there until we come up with an alternative).
- columns with variables to filter and color-, shape- or sizecode the scatterplot
- columns with context, prefixed by '_ctxt.'
    There are some commented lines in the script that generate a button for 'contexts' and a dropdown for the options
    Right now, they are commented and replaced by a dropdown with options tailored for the model (5:5 window for a 5:5 model, for instance),
    * 'model' has to be a variable that starts with '_ctxt.' where the rest of the name matches the beginning of the name of the model
    * 'raw' has to be a variable that starts with '_ctxt.' and ends with '.raw' where the rest of the name matches the beginning of the name of the model
    * 'cues' has to be a variable that starts with '_ctxt.' and ends with '.cues' where the rest of the name matrches the beginning of the name of the model
    The text in the cells can have any kind of html tags (they will be read), but one suggestion is that the target word (and only that) be enclosed by some tag with class "target"
- columns with semicolon-separated contextwords, prefixed by '_cws.', where the rest of the name matches the beginning of the name of the model

5. WHAT SHOULD THE INDEX LOOK LIKE?
Whatever you like. What you need, mainly, is an easy way to access the following url:
    "level1.html?type=[type]"
As long as the file with the link and the levels are all in the same directory, it will work.
For now, the script is not really prepared to deal with many possible types, but it can be easily solved.

6. CAN I ACCES SPECIFIC CLOUDS WITHOUT GOING THROUGH LEVEL 1 AND 2?
Yes. As long as you have all the previous scaffolding
what you need is the name of the model, and then just a link to the following url:
    "level3.html?type=[type]&model=[model]"
From that level 3, you can still go up to level 2 and level 1, and the selected model will be highlighted.

7. WHAT SHOULD [TYPE].MODELS.DIST.TSV LOOK LIKE?
This file is a tab separated distance matrix, with the names of the models as row and column names
and the distance between them (whatever generated your [type].models.tsv coordinates) as values.
You can still run everything in absence of this file, it will just say it's not available.