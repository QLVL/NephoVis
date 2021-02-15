function displayLemmas(data) {
    const col1 = d3.select('#lemmas')
        .append("div").attr("class", "col")

    const col2 = d3.select('#lemmas')
        .append("div").attr("class", "col")

    col1.selectAll('div.block')
        .data(data.slice(0, data.length/2)).enter()
        .append('div').attr('class', 'block')
            .each(announce_lemma)
    
    col2.selectAll('div.block')
        .data(data.slice(data.length/2, data.length+1)).enter()
        .append('div').attr('class', 'block')
            .each(announce_lemma)
}

function announce_lemma() {
    let p = d3.select(this);
    p.append('h2').append('a')
        .attr('href', function(d) {
            return('level1.html?type=' + d.type);
        })
        .attr("data-toggle", "tooltip")
        .attr("data-placement", "top")
        .attr("data-html", true)
        .attr("title", function(d) {
            return(
                d.models +
                " models of " +
                d.common_tokens + " to " + d['total_tokens'] +
                " tokens of the " + d['part_of_speech'] +
                " '" + d.type + "' in " + d.corpus + 
                ", created on " + d.date + '.');
        })
        .text(function(d) {
            return(d.type.slice(0, 1).toUpperCase() + d.type.slice(1));
        });
    }