# NephoVis

[![DOI](https://zenodo.org/badge/224012839.svg)](https://zenodo.org/badge/latestdoi/224012839)
![Latest release](https://img.shields.io/github/v/release/qlvl/nephovis)
[![License](https://img.shields.io/github/license/qlvl/nephovis)](https://www.gnu.org/licenses/gpl-3.0)

This is a visualization tool written in [D3.js](https://d3js.org/) by
[Mariana Montes](https://www.marianamontes.me) ([@montesmariana](https://github.com/montesmariana)) and
Thomas Wielfaert ([@twielfaert](https://github.com/twielfaert))
as part of the [Nephological Semantics project](https://www.arts.kuleuven.be/ling/qlvl/projects/current/nephological-semantics).

It is meant for visual inspection of vector space models.

## Acknowledgements

This work was supported by KU Leuven (KU Leuven Research Fund C1).
We are also greatful to the team of the Nephological Semantics project for their support and feedback: Dirk Geeraerts, Dirk Speelman, Benedikt Szmrecsanyi, Stefania Marzo, Kris Heylen, Weiwei Zhang, Karlien Franco and Stefano De Pascale.

We must also acknowledge the invaluable help of [@AlexScigalszky](https://github.com/AlexScigalszky) as well as Mike Bostock's inspiring examples.

## How to use

If you just want to explore the visualization tool, go to the  [Github Page](https://qlvl.github.io/NephoVis).
If you want to use it for your own data, follow the instructions below.

### Running NephoVis

The visualization is written in Javascript and is protected with a GPL 3 license. You can take the code, modify it and integrate it with other code, as long as the final product keeps the same license of open access. In order to use your own version of the repository, you should fork it, which requires a Github account. You can do it by clicking on the "fork" button on the top right corner of the GitHub site. This way, you may make any modifications to the code without impacting the original repository; eventually, you could suggest their implementation with a pull request. Once you have forked the repository, i.e. made a copy in your own GitHub account, you can clone it to work locally on it, for example by typing, on the command prompt and from a folder named "NephoVis":

```bash
git clone https://github.com/username/NephoVis.git
```

In this example, `username` refers to your Github account.
Now you have a copy of the code on your computer, under a folder called NephoVis! The most important aspects you might want to know about are:

- At the top level of the repository there are a number of html files, with the scaffolding of the different pages in the visualization.
- The `js/` subfolder includes various Javascript libraries --- not really the code you would want to play around with.
- The `src/` subfolder includes the Javascript scripts written by us, and underlying everything that happens in the visualization.

In its current implementation, our dataset is included as a submodule: an independent GitHub repository (`tokenclouds`) that is called as a subdirectory of the NephoVis repository. It will not be automatically included with the forked NephoVis, so if you want to use our data you will need to clone/fork it independently. But if you forked the repository in the first place that is probably not your goal; instead, you want to use your own dataset.

If you go to `src/loadData.js`, line 20 reads:

```js
const sourcedir = "tokenclouds/data/";
```

This line sets a variable `sourcedir` pointing to the path in which all the necessary files can be accessed. In this case, it goes to the subdirectory `tokenclouds` (the submodule with our datasets) and, within it, the `data` subdirectory, which has one subfolder per lemma and a tab-separated file with information on the lemmas themselves (which helps automatically generate the index pages). All you need to do to plug your own data to the visualization is then to modify the value of `sourcedir` to the path to your own dataset. That is the path that the Python workflow cited below calls `github_dir` and that the R workflow may call `output_dir`.

Before we dive into the specifications of the files this visualization can read, we'll explain how you can actually access the visualization. One of the options is to turn your forked NephoVis repository into a [GitHub Page](https://pages.github.com/), so that you can access it with your data at `https://username.github.io/NephoVis/`. That requires you to include your dataset in the (public) repository and publish it (unless you have a paid account). A local alternative is to run a server on your own computer, which is extremely easy with Python 3. From a command prompt in which you can run Python 3, go to the folder of the forked repository and run:

```bash
> python -m http.server
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

If the first line of the output matches the output above, you should be able to open `localhost:8000` on any browser and thus access your local copy of the visualization.

### Datasets for NephoVis

What data do you need for the visualization and how should you store it?
On the one hand, all the data is plain text data: either as `tsv` (tab-separated values) or `json` files. No proprietary filetypes are used. On the other hand, the structure of the files can be somewhat complicated. Note that if you follow the notebooks cited below, this is generated automatically. But as an example, let's look at the directory of one of our lemmas: `tokenclouds/data/blik/`. In all cases, when `blik` is part of the name of a file, it corresponds to the name of the lemma and changes with each lemma.

First, it has two `json` files: `paths.json` and `blik.solutions.json`. The former is compulsory and takes the form of a dictionary with all the files in the directory as values and the text between the name of the lemma and the file extension as key. This makes it easy for the visualization to know which files are available and to adapt to it.
The latter file gives information on different visualization solutions, such as MDS or t-SNE with different perplexity values. It is only necessary if you have different dimensionality reduction solution, which are stored in individual files. If this file does not exist, the tool will look up the `tokens` key in `paths.json` and interpret it as the only file with token-level coordinates.

The rest of the files are tab-separated dataframes.

- The "models" file (`blik.models.tsv`) has one row per model and the following columns: `_model` for the name of the model, `model.x` and `model.y` for the coordinates on Level 1, and as many columns as you would wish with various variables. Variables starting with `foc_` or `soc_` will be interpreted as corresponding to first-order and second-order parameter and thus organized in the radio buttons on the left panel. The `blik.models.dist` file, on the other hand, has the `_model` column for the model names and one column per model: it is the distance matrix between models. It is only necessary to operate the heatmap on Level 2, but it could be useful if it becomes possible to implement PAM or similar algorithms for automatic selection of models.
- The "medoids" file (`blik.medoids.tsv`) has at least one column `medoid` with the list of medoids for automatic selection. It is only necessary for the selection of medoids.
- The "ppmi" file (`blik.ppmi.tsv`) has one row per first-order context word: the lemma is in the `cw` row and any other information, such as raw frequency or PPMI values, can be included in following columns. This is only necessary for the additional information in the Frequency Table of Level 3.
- For each solution (in this case MDS and t-SNE with different perplexity values), we have a `blik.{solution}.tsv` file, which gives us the coordinates of each token in each model for a given solution. These dataframes have one row per token, a column `_id` with the token ID and, for each model, a `{model}.x` and a `{model}.y` columns with the corresponding coordinates. The name of the model should match a row in the "models" file, so that when a model is selected in Level 1 (or typed as the "model" parameter in the url for Level 3), the visualization knows which columns to select.
- If we also find `blik.{solution}.cws.tsv` dataframes, the visualization will use them to plot the context words in Level 3. The format is the same as for the token level data frames, but with `cw` as the ID column and a row per first-order context word.
- Independently from the number of solutions, the "variables" file (`blik.variables.tsv`) stores the information for colour, size and shape coding. With one row per token, the `_id` column includes the same token IDs used in the files with coordinates, and each of the other columns codes some variable, such as sense annotation, register, etc. Among these, some special codes are recommended (and reserved by the use of an initial underscore):
    
    + Columns starting with `_ctxt.` will be interpreted as concordance lines. `_ctxt.raw` will be read as raw text to be shown, for example, when hovering over a token in Level 2. It is also used for the Search-by-context field in Level 3. For other `_ctxt.` columns, Level 3 will search for a partial match between the rest of the name of the column and the name of a model in order to offer a tailored context. For example, the values in the `_ctxt.blik.bound5all` column will be shown in Level 3 of any model starting with `blik.bound5all` once "Tailored contexts" is set to "model".
    + Columns starting with `_cws.` will be interpreted as semicolon-separated lists of context words. For example, a cell in `_cws.blik.bound5all` that reads "werp/verb;op/prep" indicates that the models starting with `blik.bound5all` select *werp* 'to throw' and *op* 'on' for that token. This information is used for the frequency tables in Levels 2 and 3 as well as the Search-by-feature field in Level 3.
    + Columns starting with `_count.` may be used for tailored quantiative values (e.g. number of context words) based on the same rules.
    
In short, the most important files are the `paths.json` file, the "models" file for the Level 1 coordinates, at least one file with token-level coordinates and the "variables" files for the additional information. The rest of the files activate additional features.

### How to create the data

There are several steps to creating the data necessary for the visualization. The first set of steps uses Python3, in particular the [`nephosem` module](https://github.com/QLVL/nephosem/) and the [`semasioFlow` module](https://github.com/montesmariana/semasioFlow). The second set of steps uses R and a number of functions from the *ad hoc* [`semcloud`](https://github.com/montesmariana/semcloud) package; the corresponding workflow will be linked soon. This code covers how to create the kind of clouds that I worked with, *except* for the addition of **categorical variables**. Project-specific information such as register, manual sense annotation, etc., is not included and must be added by the user based on the desired information and resorces available.

Of course, you don't *need* to use this specific code to create this data. Any other code that generates comparable dataframes will work.

## Publications

Wielfaert, Thomas, Kris Heylen, Dirk Speelman & Dirk Geeraerts. 2019. Visual Analytics for Parameter Tuning of Semantic Vector Space Models. In Miriam Butt, Annette Hautli-Janisz & Verena Lyding (eds.), *LingVis: visual analytics for linguistics*, 215–245. Stanford, California: CSLI Publications, Center for the Study of Language and Information.

Montes, Mariana & Kris Heylen. Forthcoming. Visualizing Distributional Semantics. In Dennis Tay & Molly Xie Pan (eds.), *[Data Analytics in Cognitive Linguistics, Methods and Insights](https://www.degruyter.com/document/isbn/9783110687156/html)*. De Gruyter Mouton.

Montes, Mariana (2021). [_Cloudspotting. Visual analytics for distributional semantics_](https://cloudspotting.marianamontes.me/). PhD dissertation.
