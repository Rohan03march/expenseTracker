import { StyleSheet, Text, TextStyle, View } from 'react-native'
import React from 'react'
import { colors } from '@/constants/theme'
import { TypoProps } from '@/types'
import { verticalScale } from '@/utils/styling'

const Typo = ({
    size, 
    color = colors.text,
    fontWeight = '400',
    children,
    style,
    textProps = {},
}:TypoProps) => {

    const textStyle : TextStyle = {
        fontSize: size? verticalScale(size):verticalScale(18),
        color,
        fontWeight
    }
  return (
    <View>
      <Text style = {[style,textStyle]} {...textProps}>{children}</Text>
    </View>
  )
}

export default Typo

const styles = StyleSheet.create({})