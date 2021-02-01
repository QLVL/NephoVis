### Adapted from Thomas' script, sent to Kris and then to me on June 11 2019

library(MASS)
library(vegan)
library(tidyverse)

## Working directory should be the dir with isoMDS solutions
setwd("C:/Users/u0118974/xampp/htdocs/GitHub/montesmariana.github.io/NephoVis/")

lemma <- 'zwart'
models_file <- paste0(lemma, '/', lemma, '.models.tsv')
models <- read_tsv(models_file)
clouds_file <- paste0(lemma, '/', lemma, '.tsv')
cloud <- read_tsv(clouds_file)
subcloud <- cloud %>% dplyr::select(`_id`, ends_with('.x'), ends_with('.y'))

files.names <- models$`_model`
# files.names <- list.files(pattern="weightsNONE.*.points.txt")
# files.names2 <- list.files(pattern="weightsBNC\\-[0-9]\\-[0-9]pospmi.*.points.txt")
# files.names <- unlist(list(files.names, files.names2))

newmat <- files.names
n <- length(files.names)
newmat <- expand.grid(files.names, files.names)
newmat <- as.matrix(newmat)

## Reads list of tokens that are in the intersection of all models
subcloud <- subcloud %>% mutate(n = (rowSums(subcloud != 0)-1)/2) %>% 
  filter(n == max(n))
sub <- dplyr::select(subcloud, -`_id`, -n) %>% data.frame()

rnset <- subcloud$`_id`
row.names(sub) <- rnset
#rnset <- read.table("tokenIDs.txt", header=F)
rnset <- as.matrix(rnset)

res <- c()

## Procrustes analysis
for (i in 1:nrow(newmat)) {
  tryCatch({
    mat1 <- sub[c(paste0(newmat[i, 1], '.x'), paste0(newmat[i, 1], '.y'))]
    mat2 <- sub[c(paste0(newmat[i, 2], '.x'), paste0(newmat[i, 2], '.y'))]
    res[i] <- procrustes(mat1, mat2, symmetric = T)$ss
    # res[i] <- procrustes(read.table(newmat[i,1], header=T, row.names=1, sep="\t")[rnset, ], read.table(newmat[i,2], header=T, row.names=1, sep="\t")[rnset, ], symmetric=T)$ss
  }, error = function(e) {
    res[i] <- NA
    print(paste0(newmat[i,1], " ", newmat[i,2]))
})
}

## Convert to similarity matrix
res <- matrix(res, nrow=n)
# convertednames <- gsub("(*)\\.ttmx\\.k2\\.points\\.txt", "\\1", files.names)
rownames(res) <- files.names
colnames(res) <- files.names

## Apply repeatedisoMDS
wwmx <- res
if (wwmx[1,1] > 0) { wwmx <- max(wwmx) - wwmx }
wwmx[wwmx <= 0] <- 0.0000001
for (i in 1:dim(wwmx)[1]) {
  wwmx[i, i] <- 0
}
dst <- as.dist(wwmx)

# repeatedIsoMDS <- function(dst, k=k, nrepetitions=10, ...) {
#   # ----------------------------------------------------------
#   # uses initMDS(..) from package vegan
#   # ----------------------------------------------------------
#   dst.isoMDS <- isoMDS(dst, y=initMDS(dst), k=k, ...)
#   for (i in 2:nrepetitions) {
#     dst.isoMDS2 <- isoMDS(dst, y=initMDS(dst), k=k, ...)
#     if (dst.isoMDS2$stress < dst.isoMDS$stress) {
#       dst.isoMDS <- dst.isoMDS2
#     }
#   }
#   return(dst.isoMDS)
# }
# 
# k <- 2
# dst.isoMDS <- repeatedIsoMDS(dst, k=k)
dst.MDS <- metaMDS(dst, k = 2, trymax = 30)
stress <- dst.MDS$stress


# add coords to models' file
models.w.coords <- dst.MDS$points %>% as.data.frame %>% rownames_to_column %>% as_tibble %>% 
  setNames(., c('_model', 'model.x', 'model.y')) %>% 
  left_join(models, by = '_model')

models.w.coords %>% write_tsv(models_file)

library(ggplot2)
colnames(models)
models.w.coords <- models.w.coords %>% mutate(socclength_group = if_else(socclength == '10k', '10k', if_else(socclength == '5k', '5k', 'focc')))
models.w.coords %>% count(soccleft)
ggplot(models.w.coords) +
  geom_point(aes(x = model.x, y = model.y,
                 color = factor(foc_part_of_speech)))

## Write outputfiles
# type = unlist(strsplit(files.names[1], "\\."))
# type = paste0(type[1], ".", type[2])
# write.table(dst.isoMDS$points, file=paste0(type, ".models.points.txt"), sep="\t")
# write(sprintf("%.2f", stress), file=paste0(type, ".models.stress.txt"), sep="")