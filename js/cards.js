var count = {};
var games = {};

$(function() {
  $("#steam-id-submit").click(function() {
    var steam_id = $("#steam-id").val();
    if(steam_id.length > 0) {
      count = {}; games = {};
      $(".card-list").html('<img src="img/loading.gif" id="loading"/>');
      $('[id^="reddit-table"]').hide();
      getCardsJson(steam_id);
    } else {
      $('.card-list').html("<div id=\"loading\">Please input your Steam ID</div>");
    }
    return false;
  });
  
  $("#reddit-table-button").click(function() {
    $("#reddit-table").html(generateRedditTable());
    $("#reddit-table").fadeIn();
    return false;
  });
  
  $("#show-doubles, #show-all").click(function() {
    $(".card-list").html('<img src="loading.gif" id="loading"/>');
    if($(this).prop('id') == "show-doubles") {
      listDoubleGames();
      $(this).html("Show all").prop("id", "show-all");
    } else {
       listGames();
      $(this).html("Show only doubles").prop("id", "show-doubles");
    }
    return false;
  });
});

function getCardsJson(steam_id) {
  api_url = "http://whateverorigin.org/get?url=";
  if(/^\d+$/.test(steam_id))
    api_url += encodeURIComponent('https://steamcommunity.com/profiles/' + steam_id);
  else
    api_url += encodeURIComponent('https://steamcommunity.com/id/' + steam_id);
  api_url += encodeURIComponent("/inventory/json/753/6?language=english");
  
  $.ajax({
    url: api_url,
    dataType: 'jsonp',
    success: function(data) {
      // parse the json
      try {
        cards_json = $.parseJSON(data.contents)['rgDescriptions'];
        count_json = $.parseJSON(data.contents)['rgInventory'];
      }
      catch(err) {
        $('.card-list').html("<h3>And error occurred! Is your Steam profile public? Did you type your Steam ID correctly?</h3>");
        return;
      }
      
      // count the cards
      for(var key in count_json) {
        var classid = count_json[key]['classid'];
        if(count[classid]) ++count[classid]; else count[classid]=1;
      }
      
      // build up the card collection by games
      for(var key in cards_json) {
        if( // if there is no tags key
           (!("tags" in cards_json[key]) || cards_json[key]['tags'].length < 4)
            ||
            // or it's not a Trading Card or Foil
            (cards_json[key]['tags'][3]['internal_name'] != "item_class_2" && 
            cards_json[key]['tags'][3]['internal_name'] != "item_class_1")) continue;

        card = {
          'name': cards_json[key]['name'].replace(" (Trading Card)", ""),
          'game': cards_json[key]['tags'][1]['name'],
          'icon_url': cards_json[key]['icon_url'],
          'market_name': cards_json[key]['market_name'],
          'market_hash_name': cards_json[key]['market_hash_name'],
          'amount': count[cards_json[key]['classid']],	
        }
        if (games[card['game']]) {
          // if there is only 1 card no problem
          if(card['amount'] === 1) games[card['game']].push(card);
          // in case of 2 cards they are twice in the rgDescriptions too
          // so we have to do this to avoid adding them twice
          else {
            var add = true;
            for(var idx in games[card['game']])
              if(games[card['game']][idx]['name'] === card['name']) {add = false; break;}
            if(add) games[card['game']].push(card);
          }
        } else {
          games[card['game']] = [card];
        }
      }
      listGames();
    }
  });
}

// return the HTML of the one card box
function get_card(name, img_src, market_url, amount) {
  return '<div class="card-box">' + 
          '<div class="card-box-image">' +
            '<img src="http://cdn.steamcommunity.com/economy/image/' + img_src + '"/>' + 
          '</div>' + 
          '<div class="card-box-text">' + 
            name + (amount > 1 ? ' x' + amount : '') + '<br />' + 
            '<a target="blank" href="http://steamcommunity.com/market/listings/753/' + encodeURIComponent(market_url) + '">Steam market</a>' +
          '</div>' + 
         '</div>';
 }

// generates the HTML with the game names + cards
function generateHTML() {
  html = ""
  for(var key in games) {
    html += "<h2>" + key + "</h2>";
    for(var i in games[key]) {
      card = games[key][i];
      html += get_card(card['name'], card['icon_url'], card['market_hash_name'], card['amount']);
    }
    html += '<div style="clear: both;"></div>';
  }
  return html;
}

// generates the HTML for the double cards list
function generateDoubleHTML() {
  html = ""
  for(var key in games) {
    var hasDouble = false;
    for(var i in games[key]) {
      card = games[key][i];
      if(card['amount'] > 1) {
        if(!hasDouble) {
          html += "<h2>" + key + "</h2>";
          hasDouble = true;
        }
        html += get_card(card['name'], card['icon_url'], card['market_hash_name'], card['amount']);
      }
    }
    html += '<div style="clear: both;"></div>';
  }
  return html;
}

// generates a table code for reddit.com
function generateRedditTable() {
  table = "|Game|Cards\n|:-|:-:|";
  for(var key in games) {
    table += "\n|" + key + "|";
    for(var i in games[key]) {
      var card = games[key][i];
      table += card['name'] + (card['amount'] > 1 ? ' x' + card['amount'] : '') + ', ';
    }
    table = table.substr(0, table.length-2) + '|';
  }
  return table;
}

// adds the generated HTML to the page
function listGames() {
  $(".card-list").html(generateHTML());
  $("#reddit-table-button").fadeIn();
  $("#show-doubles").fadeIn();
}

// adds the doubles to the page
function listDoubleGames() {
  $(".card-list").html(generateDoubleHTML());
}
