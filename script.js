var search = document.getElementById("query");
var displayTable = document.getElementById("Table");
var market = document.getElementById("market");
var SpotifyAPI = "https://api.spotify.com/v1/";
var ShowImages = document.getElementById("ShowImages");

function MBReponseStatus(Status){
	document.getElementById("MBMatchStatus").innerHTML=Status;
}

function parseMBID(input){
	if (input.length==36){
	return input;}
	else if (input.length>36){
		return input.slice(-36)
	}
	else {
		MBReponseStatus("Invalid length");
		return "";
	}
}

function MatchMBID()
{
	MBReponseStatus("");
	var xmlhttp = new XMLHttpRequest();
	var MBReleaseID = parseMBID(document.getElementById("MBReleaseID").value);
	
	var url =  "http://musicbrainz.org/ws/2/release/" + MBReleaseID+ "?inc=recordings&fmt=json";
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var data = JSON.parse(xmlhttp.responseText);
			fillMBIDs(data);
		}
		if (xmlhttp.readyState == 4 && xmlhttp.status == 503) {
			MBReponseStatus("Server busy");
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function JoinAllMedia(MBObject){
	for (var x =0; x<MBObject.media.length; x+=1)
		{
			if (x==0){
				MBObject.alltracks=MBObject.media[0].tracks;
			}
			else {
			MBObject.alltracks=MBObject.alltracks.concat(MBObject.media[x].tracks);
		}
		}
	delete MBObject.media;
	return MBObject;
}

function fillMBIDs(data){
	data=JoinAllMedia(data);
	if (TotalTracks==data.alltracks.length){
		document.getElementById("MBSubmit").disabled=false;
		for (x=0; x<data.alltracks.length;x++){
			document.getElementById("SubmitISRCTrack"+ (x+1)).value=data.alltracks[x].recording.id + " " + document.getElementById("SubmitISRCTrack"+ (x+1)).value;
			document.getElementById("MBTitleTrack"+(x+1)).innerHTML+=data.alltracks[x].title;
			document.getElementById("MBTitleTrackHead").setAttribute("style","display: inherit;");
		
	}}
		else{
			MBReponseStatus("Track count did not match");
		}
}

function ArtistsArrayWithLinks(data) {
	var i;
	var Text = "";
	for (i = 0; i < data.length; i += 1) {
		Text += "<a onclick=\"fetchArtistDetails(\'" + data[i].id + "\')\">" + data[i].name + "</a> ";
	}
	return Text;
}

function CreateImage(value, CSSClass) {
	if (ShowImages.checked) {
		return "<img src=\"" + value + "\" class=\"" + CSSClass + "\"> ";
	} else {
		return "";
	}
}

function SetTrackDetails(data, id, absoluteTrackNumber) {
	var trackISRC = data.external_ids.isrc;
	document.getElementById(id + "ISRC").innerHTML = trackISRC;
	document.getElementById(id + "MBlink").innerHTML = "<a href=\"http://musicbrainz.org/isrc/" + trackISRC + "\"> Lookup</a>";
	document.getElementById("SubmitISRCTrack" + absoluteTrackNumber).value=trackISRC;
	document.getElementById(id + "Artist").innerHTML = ArtistsArrayWithLinks(data.artists);

}

function FetchTrackDetails(id,absoluteTrackNumber) {
	var xmlhttp = new XMLHttpRequest();
	var url = SpotifyAPI + "tracks/" + id;
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var data = JSON.parse(xmlhttp.responseText);
			SetTrackDetails(data, id, absoluteTrackNumber);
		}
	}
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}
var TotalTracks;
function AlbumOverview(data) {
	var Text = "";
	Text += "<table class=\"summary\"><tr><td rowspan=\"5\">" + CreateImage(data.images[0].url, "cover") + "</td><td>" + data.name + "</td></tr>";

	Text += "<tr><td>";
	Text += ArtistsArrayWithLinks(data.artists);
	//		for (i = 0; i < data.artists.length; i += 1) {
	//		Text += data.artists[i].name + ", ";
	//	}
	Text += "</td></tr>";
	Text += "<tr><td>" + data.id + "</tr></td>";
	//loop over all copyrights
	Text += "<tr><td>";
	for (i = 0; i < data.copyrights.length; i += 1) {
		Text += data.copyrights[i].text + " ";
	}
	Text += "</td></tr><tr><td>";
	for (i = 0; i < data.available_markets.length; i += 1) {
		Text += data.available_markets[i] + " ";
	}
	Text += "</td></tr></table>";
	TotalTracks=data.tracks.total;
	return Text;
}

function CreateAlbumDetails(data) {
	var i;
	var Text = "";
	Text += AlbumOverview(data);
	ThisAlbum=Array(data.tracks.total);
	Text += "<form method=\"post\"action=\"http://musicbrainz.org/ws/1/track/\" target=\"_blank\"><table><tr><td>Title</td></td><td>Artist</td><td>Spotify ID</td><td>ISRC</td><td>MusicBrainz</td><td id=\"MBTitleTrackHead\" >Matched Title</td></tr>";
	for (i = 0; i < data.tracks.items.length; i += 1) {
		var TrackID = data.tracks.items[i].id;
		// ThisAlbum[i].SpotifyID=data.tracks.items[i].id;
		var TrackNumber= i+1;
		// ThisAlbum[i].TrackNumber=data.tracks.items[i].track_number;
		Text += "<tr><td>" + data.tracks.items[i].name + "<input hidden type=\"input\" id=\"SubmitISRCTrack"+TrackNumber+"\" name=\"isrc\" value=\"\"></td><td id=\"" + TrackID + "Artist\"\><td>" + TrackID + "</td><td id=\"" + TrackID + "ISRC\"\></td><td id=\"" + TrackID + "MBlink\"\></td><td id=\"MBTitleTrack"+TrackNumber+"\"></td></tr>";;
	}
	Text += "</table><button id=\"MBSubmit\" disabled>Submit to MusicBrainz</button></form>";
	displayTable.innerHTML = Text;
	for (i = 0; i < data.tracks.items.length; i += 1) {
		FetchTrackDetails(data.tracks.items[i].id,i+1);
	}
}

function fetchAlbumDetails(id) {
	var xmlhttp = new XMLHttpRequest();
	var url = SpotifyAPI + "albums/" + id;
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var data = JSON.parse(xmlhttp.responseText);
			CreateAlbumDetails(data);
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}


function AlbumResults(data) {
	var i;
	var Row = "<tr>";
	var cRow = "</tr>";
	var Cell = "<td>";
	var cCell = "</td>"
	var Text = "";
	Text += "<table>" + Row + Cell + "title</td><td>Spotify ID</td></tr>";
	for (i = 0; i < data.items.length; i += 1) {
		Text += "<tr onclick=\"fetchAlbumDetails(&quot;" + data.items[i].id + "&quot;)\"><td>" + data.items[i].name + "</td><td>" + data.items[i].id + "</td><td>";
		try {
			Text += CreateImage(data.items[i].images[2].url, "");
		} catch (err) {}
		Text += "</td></tr>";
	} + cCell + cRow;
	Text += "</table>";
	displayTable.innerHTML = Text;
}

function fetchArtistDetails(id) {
	var xmlhttp = new XMLHttpRequest();
	var url = SpotifyAPI + "artists/" + id + "/albums";
	if (market.value != "" && market.value != null) {
		url += "?market=" + market.value
	};
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var data = JSON.parse(xmlhttp.responseText);
			AlbumResults(data);
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function ArtistResults(data) {
	var i;
	var Text = "";
	Text += "<table><tr><td>Artist</td><td>Spotify ID</td><td></td></tr>";
	for (i = 0; i < data.artists.items.length; i += 1) {
		Text += "<tr onclick=\"fetchArtistDetails(&quot;" + data.artists.items[i].id + "&quot;)\"><td>" + data.artists.items[i].name + "</td><td>" + data.artists.items[i].id + "</td><td>";
		try {
			Text += CreateImage(data.artists.items[i].images[2].url, "");
		} catch (err) {}
		Text += "</td></tr>";
	}
	Text += "</table>";
	displayTable.innerHTML = Text;
}

function artistSearch() {
	var xmlhttp = new XMLHttpRequest();
	var url = SpotifyAPI + "search?q=+" + search.value + "&type=artist";
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var data = JSON.parse(xmlhttp.responseText);
			ArtistResults(data);
		}

	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function albumSearch() {
	var xmlhttp = new XMLHttpRequest();
	var url = SpotifyAPI + "search?q=+" + search.value + "&type=album";
	if (market.value != "" && market.value != null) {
		url += "&market=" + market.value
	};
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var data = JSON.parse(xmlhttp.responseText);
			AlbumResults(data.albums);
		}

	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function Search() {
	if (document.getElementById("selectAlbum").checked) {
		albumSearch();
	}
	if (document.getElementById("selectArtist").checked) {
		artistSearch();
	}

}

function Lookup() {
	if (document.getElementById("selectAlbum").checked) {
		fetchAlbumDetails(search.value);
	}
	if (document.getElementById("selectArtist").checked) {
		fetchArtistDetails(search.value);
	}
}