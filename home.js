$('#new_seed_btn').click( () => {
    $('#name_seed_modal').css('display', 'block');
});

$('#start_create_btn').click( () => {
    $('#name_seed_modal').css('display', 'none');
    var seedName = $('#new_seed_name').val();

    window.location.href = "index.html" + '#' + seedName;
});

var items = JSON.parse(localStorage.getItem("seeds"));
console.log(items)

for(var i = 0; i < items["items"].length; i++){
    var item = items["items"][i];

    var newSeed = 
    `
    <div id='seed${item.name}' class='seed'>
    <p class='seed_name'>${item.name}</p>
    </div>
    `;
    $('#seed_list').append(newSeed)

    var seedHTML = $.parseHTML(item.html);
    $(seedHTML).find('img').toArray().slice(0,4).forEach(image => $(`#seed${item.name}`).append(image));
}
