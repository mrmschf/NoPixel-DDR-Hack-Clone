-- ddr.lua
local resultReceived = false
local p = nil

RegisterNUICallback('callback', function(data, cb)
    SetNuiFocus(false, false)
    resultReceived = true
    if data.success then
        p:resolve(true)
    else
        p:resolve(false)
    end
    p = nil
    cb('ok')
end)

local function hacking(cb, difficulty, timer)
    if not difficulty then difficulty = 'easy' end
    if not timer then timer = 30 end

    resultReceived = false
    p = promise.new()
    SendNUIMessage({
        action = 'open',
        difficulty = difficulty,
        timer = timer,
    })
    SetNuiFocus(true, true)
    local result = Citizen.Await(p)
    cb(result)
end

exports("hacking", hacking)

RegisterCommand('ddr', function(source, args)
    local difficulty = args[1] or 'easy'
    local timer = tonumber(args[2]) or 30

    exports['ddr']:hacking(function(success)
        if success then
            print("success")
        else
            print("fail")
        end
    end, difficulty, timer)
end,)
