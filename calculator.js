const { NormalGoGos, Weapons, Gear } = require('./balance.json');
const weapon = require('./commands/weapon');
const database = require('./database');

async function calcWeaponStats(weaponIdentifier,weaponlvl) {
    const atkBoost = (Weapons[weaponIdentifier]["ATK"])*((weaponlvl/10) + 1);
    const scalerType = Weapons[weaponIdentifier]["scaler"];
    var crBoost
    var cdBoost 
    if (scalerType=="dmg") {
        cdBoost = (Weapons[weaponIdentifier]["CRITDMG"])*((weaponlvl/10)+1)
        crBoost = (Weapons[weaponIdentifier]["CRITDMG"])
    } else if (scalerType=="rate") {
        cdBoost = (Weapons[weaponIdentifier]["CRITDMG"])
        crBoost = (Weapons[weaponIdentifier]["CRITDMG"])*((weaponlvl/10)+1)
    }
    return [parseFloat(atkBoost.toFixed(2).toString()),parseFloat(crBoost.toFixed(3).toString(3)),parseFloat(cdBoost.toFixed(3).toString())];
}


module.exports = {
    async calcWeaponStats(weaponIdentifier,weaponlvl) {
        const atkBoost = (Weapons[weaponIdentifier]["ATK"])*((weaponlvl/10) + 1);
        const scalerType = Weapons[weaponIdentifier]["scaler"];
        var crBoost
        var cdBoost 
        if (scalerType=="dmg") {
            cdBoost = (Weapons[weaponIdentifier]["CRITDMG"])*((weaponlvl/10)+1)
            crBoost = (Weapons[weaponIdentifier]["CRITDMG"])
        } else if (scalerType=="rate") {
            cdBoost = (Weapons[weaponIdentifier]["CRITDMG"])
            crBoost = (Weapons[weaponIdentifier]["CRITDMG"])*((weaponlvl/10)+1)
        }
        return [parseFloat(atkBoost.toFixed(2).toString()),parseFloat(crBoost.toFixed(3).toString(3)),parseFloat(cdBoost.toFixed(3).toString())];
    },
    async calcGoGoStats(gogo) {
        const bGoGo = NormalGoGos[gogo.id.split('#')[0]];
        const statMultiplier = gogo.lvl*0.1+1.0;
        const gears = [gogo.gear1,gogo.gear2,gogo.gear3];

        var gogoATK = bGoGo["ATK"]*statMultiplier;
        var gogoATKBoost = 0;
        var gogoHP = bGoGo["HP"]*statMultiplier;
        var gogoHPBoost = 0;
        var gogoCRBoost = 0;
        var gogoCDBoost = 0;
        for (let i=0; i<3; i++) {
            if (gears[i] != '') {
                const gear = await database.getGear(gears[i]);
                if (gear.ATK >= 1) {
                    gogoATKBoost += gear.ATK;
                } else {
                    gogoATKBoost += gear.ATK*gogoATK;
                }
                if (gear.HP >= 1) {
                    gogoHPBoost += gear.HP;
                } else {
                    gogoHPBoost += gear.HP*gogoHP;
                }
                gogoCRBoost += gear.CRITRATE;
                gogoCDBoost += gear.CRITDMG;
            }
        }
        if (gogo.weapon != '') {
            const weapon = await database.getWeapon(gogo.weapon);
            var boosts = calcWeaponStats(gogo.weapon.split('#')[0].split('/')[1],weapon.lvl);
            gogoATKBoost += boosts[0];
            gogoCRBoost += boosts[1];
            gogoCDBoost += boosts[2];
        }
        gogoATKBoost = parseFloat(gogoATKBoost.toFixed(2).toString());
        gogoATK = parseFloat(gogoATK.toFixed(2).toString());
        gogoHPBoost = parseFloat(gogoHPBoost.toFixed(2).toString());
        gogoHP = parseFloat(gogoHP.toFixed(2).toString());
        gogoCRBoost = parseFloat(gogoCRBoost.toFixed(3).toString());
        gogoCDBoost = parseFloat(gogoCDBoost.toFixed(3).toString());
        // RETURNS: Array: final ATK, final HP, final CR, final CD
        return [gogoATK+gogoATKBoost, gogoHP+gogoHPBoost, bGoGo["CRITRATE"]+gogoCRBoost, bGoGo["CRITDMG"]+gogoCDBoost];
    }
}