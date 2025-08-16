<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Constellations</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
<div class="container">
    <h1>Constellation Search</h1>
    <form id="constellationForm">
        <label for="constellation">Choose a constellation:</label>
        <select id="constellation" name="constellation">
            <option value="and">Andromeda</option>
            <option value="ant">Antlia</option>
            <option value="aps">Apus</option>
            <option value="aqr">Aquarius</option>
            <option value="aql">Aquila</option>
            <option value="ara">Ara</option>
            <option value="ari">Aries</option>
            <option value="aur">Auriga</option>
            <option value="boo">Boötes</option>
            <option value="cae">Caelum</option>
            <option value="cam">Camelopardalis</option>
            <option value="cnc">Cancer</option>
            <option value="cvn">Canes Venatici</option>
            <option value="cma">Canis Major</option>
            <option value="cmi">Canis Minor</option>
            <option value="cap">Capricornus</option>
            <option value="car">Carina</option>
            <option value="cas">Cassiopeia</option>
            <option value="cen">Centaurus</option>
            <option value="cep">Cepheus</option>
            <option value="cet">Cetus</option>
            <option value="cha">Chamaeleon</option>
            <option value="cir">Circinus</option>
            <option value="col">Columba</option>
            <option value="com">Coma Berenices</option>
            <option value="cra">Corona Austrina</option>
            <option value="crb">Corona Borealis</option>
            <option value="crv">Corvus</option>
            <option value="crt">Crater</option>
            <option value="cru">Crux</option>
            <option value="cyg">Cygnus</option>
            <option value="del">Delphinus</option>
            <option value="dor">Dorado</option>
            <option value="dra">Draco</option>
            <option value="equ">Equuleus</option>
            <option value="eri">Eridanus</option>
            <option value="for">Fornax</option>
            <option value="gem">Gemini</option>
            <option value="gru">Grus</option>
            <option value="her">Hercules</option>
            <option value="hor">Horologium</option>
            <option value="hya">Hydra</option>
            <option value="hyi">Hydrus</option>
            <option value="ind">Indus</option>
            <option value="lac">Lacerta</option>
            <option value="leo">Leo</option>
            <option value="lmi">Leo Minor</option>
            <option value="lep">Lepus</option>
            <option value="lib">Libra</option>
            <option value="lup">Lupus</option>
            <option value="lyn">Lynx</option>
            <option value="lyr">Lyra</option>
            <option value="men">Mensa</option>
            <option value="mic">Microscopium</option>
            <option value="mon">Monoceros</option>
            <option value="mus">Musca</option>
            <option value="nor">Norma</option>
            <option value="oct">Octans</option>
            <option value="oph">Ophiuchus</option>
            <option value="ori">Orion</option>
            <option value="pav">Pavo</option>
            <option value="peg">Pegasus</option>
            <option value="per">Perseus</option>
            <option value="phe">Phoenix</option>
            <option value="pic">Pictor</option>
            <option value="psc">Pisces</option>
            <option value="psa">Piscis Austrinus</option>
            <option value="pup">Puppis</option>
            <option value="pyx">Pyxis</option>
            <option value="ret">Reticulum</option>
            <option value="sge">Sagitta</option>
            <option value="sgr">Sagittarius</option>
            <option value="sco">Scorpius</option>
            <option value="scl">Sculptor</option>
            <option value="sct">Scutum</option>
            <option value="ser">Serpens Cauda</option>
            <option value="sex">Sextans</option>
            <option value="tau">Taurus</option>
            <option value="tel">Telescopium</option>
            <option value="tri">Triangulum</option>
            <option value="tra">Triangulum Australe</option>
            <option value="tuc">Tucana</option>
            <option value="uma">Ursa Major</option>
            <option value="umi">Ursa Minor</option>
            <option value="vel">Vela</option>
            <option value="vir">Virgo</option>
            <option value="vol">Volans</option>
            <option value="vul">Vulpecula</option>
        </select>

        <label for="style">Choose style:</label>
        <select id="style" name="style">
            <option value="default">Default</option>
            <option value="inverted">Inverted</option>
            <option value="navy">Navy</option>
            <option value="red">Red</option>
        </select>

        <button type="submit">Search</button>
    </form>

    <div id="result"></div>
</div>

<div id="star-container"></div>

<script>
    async function fetchConstellation(constellation = 'and', style = 'default') {
        try {
            const res = await fetch(`buscar.php?constellation=${constellation}&style=${style}`);
            const data = await res.json();

            if (data.error) {
                document.getElementById('star-container').innerHTML = `<p>${data.error}</p>`;
            } else {
                document.getElementById('star-container').innerHTML = `
                <h3>Constellation: ${data.constellation}</h3>
                <h4>Style: ${data.style}</h4>
                <img src="${data.image}" alt="Star Chart of ${data.constellation}" />
            `;
            }
        } catch (err) {
            document.getElementById('star-container').innerHTML = `<p>Fetch error: ${err}</p>`;
        }
    }

    // Exemplo: busca Andromeda com estilo default
    fetchConstellation('and', 'default');
</script>
