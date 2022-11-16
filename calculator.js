const { NormalGoGos, Weapons, Gear } = require('./balance.json');
const weapon = require('./commands/weapon');

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
}